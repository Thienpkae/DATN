'use strict';
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { connectToNetwork } = require('./networkService');
const proj4 = require('proj4');

// Absolute paths as provided by repo scripts
const CID_MAPPING_PATH = path.resolve('/home/thien/Blockchain/DATN/ipfs_cid_mapping.json');

let CACHE_BUILDING = false;
let CACHE_GEOJSON = null; // { type, features }
let CACHE_TIMESTAMP = 0;

function safeReadJSON(filePath) {
	try {
		if (!fs.existsSync(filePath)) return null;
		const raw = fs.readFileSync(filePath, 'utf-8');
		return JSON.parse(raw);
	} catch (e) {
		console.error('safeReadJSON error:', filePath, e.message);
		return null;
	}
}

function resolveGeometryByCid(geometryCid, cidMapping) {
	try {
		if (!geometryCid) return null;
		const cidOnly = geometryCid.startsWith('/ipfs/') ? geometryCid.slice(6) : geometryCid;
		const entry = Object.values(cidMapping || {}).find(m => m && m.cid === cidOnly);
		if (entry && entry.file_path && fs.existsSync(entry.file_path)) {
			const raw = fs.readFileSync(entry.file_path, 'utf-8');
			return JSON.parse(raw);
		}
	} catch (e) {
		console.error('resolveGeometryByCid error:', e.message);
	}
	return null;
}

function resolveGeometryByLandId(landId, cidMapping) {
    try {
        const entry = cidMapping && cidMapping[landId];
        if (entry && entry.file_path && fs.existsSync(entry.file_path)) {
            const raw = fs.readFileSync(entry.file_path, 'utf-8');
            return JSON.parse(raw);
        }
    } catch (e) {
        console.error('resolveGeometryByLandId error:', e.message);
    }
    return null;
}

// Define projections: source VN-2000 / UTM zone 48N (EPSG:3405) → WGS84 lon/lat
const EPSG_3405 = '+proj=utm +zone=48 +ellps=WGS84 +units=m +no_defs +type=crs';

function transformCoordinateXY(x, y) {
    try {
        const [lon, lat] = proj4(EPSG_3405, proj4.WGS84, [x, y]);
        return [lon, lat];
    } catch (e) {
        return [x, y];
    }
}

function transformCoordinatesDeep(coords) {
    if (!Array.isArray(coords)) return coords;
    // If this level is a position [x,y]
    if (coords.length >= 2 && typeof coords[0] === 'number' && typeof coords[1] === 'number') {
        return transformCoordinateXY(coords[0], coords[1]);
    }
    // Otherwise recurse
    return coords.map(transformCoordinatesDeep);
}

function transformGeometryToWGS84(geometry) {
    if (!geometry || !geometry.type) return geometry;
    const type = geometry.type;
    if (type === 'GeometryCollection') {
        return {
            type,
            geometries: (geometry.geometries || []).map(transformGeometryToWGS84)
        };
    }
    if (geometry.coordinates) {
        return {
            type,
            coordinates: transformCoordinatesDeep(geometry.coordinates)
        };
    }
    return geometry;
}

function transformFeatureToWGS84(feature) {
    if (!feature) return feature;
    if (feature.type === 'Feature') {
        return Object.assign({}, feature, {
            geometry: transformGeometryToWGS84(feature.geometry)
        });
    }
    // If input is a bare geometry, wrap as Feature
    if (feature.type && feature.coordinates) {
        return {
            type: 'Feature',
            geometry: transformGeometryToWGS84(feature),
            properties: {}
        };
    }
    return feature;
}

async function buildCacheFromOnChain(org, userID) {
	if (CACHE_BUILDING) return;
	CACHE_BUILDING = true;
    try {
        const { contract } = await connectToNetwork(org, userID);
        const result = await contract.evaluateTransaction('QueryAllLands', userID);
        const raw = result ? JSON.parse(result.toString()) : [];
        // Normalize Fabric results: either plain objects or {Record}
        const lands = Array.isArray(raw) ? raw.map(item => (item && item.Record) ? item.Record : item) : [];
        const cidFile = safeReadJSON(CID_MAPPING_PATH) || {};
        const cidMapping = cidFile.cid_mapping || cidFile.mapping || cidFile || {};

        const features = [];
        console.log(`[mapService] QueryAllLands count: ${lands.length}`);
		// Deterministic order
		lands.sort((a, b) => {
			const [dca, ida] = String(a.id || '').split('-');
			const [dcb, idb] = String(b.id || '').split('-');
			if (dca === dcb) return Number(ida) - Number(idb);
			return Number(dca) - Number(dcb);
		});

        let missingCid = 0, loadedByCid = 0, loadedById = 0;
        for (const land of lands) {
			const geometryCid = land.geometryCid || land.geometryCID || land.GeometryCID || '';
            let gj = resolveGeometryByCid(geometryCid, cidMapping);
            if (!gj) {
                if (!geometryCid) missingCid++;
                // Fallback by land id
                gj = resolveGeometryByLandId(land.id, cidMapping);
                if (gj) loadedById++;
            } else {
                loadedByCid++;
            }
            if (!gj) continue;
			const props = {
				id: land.id || '',
				ownerId: land.ownerID || land.ownerId || '',
				usePurpose: land.landUsePurpose || land.usePurpose || '',
				area: land.area !== undefined && land.area !== null ? land.area : null,
                dc: (land.id && String(land.id).split('-')[0]) || '',
                location: land.location || land.Location || '',
                legalStatus: land.legalStatus || land.LegalStatus || '',
                legalInfo: land.legalInfo || land.LegalInfo || ''
			};
            // Normalize input to an array of GeoJSON Features or raw geometries
            let list;
            if (Array.isArray(gj.features)) {
                list = gj.features;
            } else if (gj && gj.type === 'FeatureCollection' && Array.isArray(gj.features)) {
                list = gj.features;
            } else if (gj && gj.geometry && gj.geometry.type) {
                // Case: { landId, geometry: { type, coordinates } }
                list = [{ type: 'Feature', geometry: gj.geometry, properties: {} }];
            } else if (gj && gj.type && gj.coordinates) {
                // Bare geometry object
                list = [{ type: 'Feature', geometry: gj, properties: {} }];
            } else {
                list = [gj];
            }
			for (const feat of list) {
                if (!feat) continue;
                const asFeature = feat.type === 'Feature' ? feat : { type: 'Feature', geometry: feat.geometry || feat, properties: {} };
                const transformed = transformFeatureToWGS84(asFeature);
                transformed.properties = Object.assign({}, transformed.properties || {}, props);
                features.push(transformed);
			}
		}

        CACHE_GEOJSON = { type: 'FeatureCollection', features };
		CACHE_TIMESTAMP = Date.now();
        console.log(`[mapService] Built on-chain GeoJSON cache with ${features.length} features (byCid=${loadedByCid}, byId=${loadedById}, missingCid=${missingCid})`);
	} catch (e) {
		console.error('[mapService] build cache error:', e.message);
	} finally {
		CACHE_BUILDING = false;
	}
}

const mapService = {
	// GET /api/org1/map/geojson
	async getOrg1CadastralGeoJSON(req, res) {
		try {
			const userID = req.user.cccd;
			const org = req.user.org;
			// Rebuild cache if empty or older than 5 minutes
            if ((!CACHE_GEOJSON || (CACHE_GEOJSON && Array.isArray(CACHE_GEOJSON.features) && CACHE_GEOJSON.features.length === 0)) && !CACHE_BUILDING) {
				buildCacheFromOnChain(org, userID);
			}
			const t0 = Date.now();
			while (!CACHE_GEOJSON && Date.now() - t0 < 5000) {
				// eslint-disable-next-line no-await-in-loop
				await new Promise(r => setTimeout(r, 50));
			}
			if (!CACHE_GEOJSON) {
				return res.status(202).json({ status: 'building', retryAfterMs: 1000 });
			}
			res.setHeader('Content-Type', 'application/json');
			res.setHeader('Content-Encoding', 'gzip');
			const gz = zlib.createGzip();
			gz.pipe(res);
			gz.end(JSON.stringify(CACHE_GEOJSON));
		} catch (e) {
			console.error('[mapService] getOrg1CadastralGeoJSON error:', e.message);
			res.status(500).json({ error: 'failed_to_serve_geojson' });
		}
	}
};

module.exports = mapService;


