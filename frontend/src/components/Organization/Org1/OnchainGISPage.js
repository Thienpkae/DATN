import React, { useEffect, useRef } from 'react';
import { Card } from 'antd';
import authService from '../../../services/auth';

// On-chain GIS page for Org1 using MapLibre via CDN
// Fetches secured GeoJSON with Authorization header and renders client-side

const OnchainGISPage = () => {
  const mapRef = useRef(null);
  const containerRef = useRef(null);
  const cleanupRef = useRef({ scripts: [], links: [] });

  useEffect(() => {
    // Capture ref snapshot for cleanup
    const localCleanup = cleanupRef.current;
    // Inject MapLibre CSS/JS via CDN
    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = 'https://unpkg.com/maplibre-gl@3.6.1/dist/maplibre-gl.css';
    document.head.appendChild(css);

    // Load MapLibre and proj4 (for coordinate display in EPSG:3405)
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/maplibre-gl@3.6.1/dist/maplibre-gl.js';
    script.async = true;
    document.body.appendChild(script);

    const proj4Script = document.createElement('script');
    proj4Script.src = 'https://unpkg.com/proj4@2.11.0/dist/proj4.js';
    proj4Script.async = true;
    document.body.appendChild(proj4Script);

    localCleanup.links.push(css);
    localCleanup.scripts.push(script);
    localCleanup.scripts.push(proj4Script);

    script.onload = async () => {
      try {
        if (!containerRef.current) return;
        // Ensure proj4 is loaded before proceeding
        if (!window.proj4) {
          await new Promise((resolve) => {
            proj4Script.onload = resolve;
          });
        }
        // Create map container (clear previous children to avoid duplicates)
        try { while (containerRef.current.firstChild) containerRef.current.removeChild(containerRef.current.firstChild); } catch (_) {}
        const mapEl = document.createElement('div');
        mapEl.style.width = '100%';
        mapEl.style.height = '600px';
        containerRef.current.appendChild(mapEl);

        // Initialize map
        const map = new window.maplibregl.Map({
          container: mapEl,
          style: {
            version: 8,
            sources: {},
            layers: []
          },
          center: [105.8, 21.0],
          zoom: 8,
          renderWorldCopies: false,
          attributionControl: false
        });
        mapRef.current = map;

        // Fetch secured GeoJSON with polling (handles 202 building)
        const apiBase = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';
        const token = authService.getAuthToken();
        const fetchGeojson = async () => {
          const resp = await fetch(`${apiBase}/org1/map/geojson`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (resp.status === 202) {
            await new Promise(r => setTimeout(r, 500));
            return fetchGeojson();
          }
          if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
          return resp.json();
        };
        const data = await fetchGeojson();
        const purposeDescriptions = {
          LUC: 'Đất chuyên trồng lúa nước',
          ONT: 'Đất ở tại nông thôn',
          BHK: 'Đất bằng trồng cây hàng năm khác',
          SKC: 'Đất cơ sở sản xuất phi nông nghiệp',
          DTL: 'Đất thủy lợi',
          DGT: 'Đất giao thông',
          LNQ: 'Đất trồng cây ăn quả lâu năm',
          NTS: 'Đất nuôi trồng thủy sản',
          TIN: 'Đất tín ngưỡng'
        };
        const counts = {};
        (data.features || []).forEach(ft => {
          const code = ft && ft.properties && ft.properties.usePurpose;
          if (!code) return;
          counts[code] = (counts[code] || 0) + 1;
        });

        const addLayers = () => {
          if (map.getSource('parcels')) return;
          map.addSource('parcels', { type: 'geojson', data, promoteId: 'id', generateId: true });

          // Color mapping similar to static map MDSD palette
          const colorExpr = [
            'match', ['coalesce', ['get', 'usePurpose'], ''],
            'LUC', '#f1c40f',
            'ONT', '#27ae60',
            'BHK', '#2ecc71',
            'SKC', '#e67e22',
            'DTL', '#3498db',
            'DGT', '#95a5a6',
            'LNQ', '#9b59b6',
            'NTS', '#1abc9c',
            'TIN', '#c0392b',
            'NTD', '#7f8c8d',
            'MNC', '#8e44ad',
            'DVH', '#d35400',
            'DYT', '#c0392b',
            'TSK', '#2c3e50',
            'TSC', '#7f8c8d',
            'DNL', '#16a085',
            'DGD', '#f1c40f',
            'DCH', '#e74c3c',
            'SON', '#3498db',
            'DRA', '#9b59b6',
            '#bdc3c7'
          ];

          map.addLayer({
            id: 'parcels-fill',
            type: 'fill',
            source: 'parcels',
            paint: {
              'fill-color': colorExpr,
              'fill-opacity': 1.0,
              'fill-antialias': true
            }
          });
          map.addLayer({
            id: 'parcels-line',
            type: 'line',
            source: 'parcels',
            paint: { 'line-color': '#2c3e50', 'line-width': 1.2 }
          });

          const popup = new window.maplibregl.Popup({ closeButton: false, closeOnClick: false });
          let lastHoverId = null;
          map.on('mousemove', 'parcels-fill', (e) => {
            const f = e.features && e.features[0];
            if (!f) return;
            const p = f.properties || {};
            const legalStatusLine = `<div><b>Trạng thái pháp lý:</b> <span style="color:#0d6efd">${(p.legalStatus && String(p.legalStatus).trim()) || 'Chưa có'}</span></div>`;
            const html = `<div style="font:12px/1.4 sans-serif">
              <div><b>Số tờ bản đồ:</b> ${p.dc || ''}</div>
              <div><b>Số thửa:</b> ${p.id ? String(p.id).split('-')[1] || '' : ''}</div>
              <div><b>Diện tích:</b> ${p.area ?? ''} m²</div>
              <div><b>MDSD2003:</b> ${p.usePurpose || ''}</div>
              ${p.ownerId ? `<div><b>Chủ sử dụng:</b> ${p.ownerId}</div>` : ''}
              ${p.location ? `<div><b>Địa chỉ:</b> ${p.location}</div>` : ''}
              ${legalStatusLine}
            </div>`;
            popup.setLngLat(e.lngLat).setHTML(html).addTo(map);

            // Lightweight hover highlight using feature-state if id exists
            if (f.id != null) {
              if (lastHoverId !== null && lastHoverId !== f.id) {
                map.setFeatureState({ source: 'parcels', id: lastHoverId }, { hover: false });
              }
              map.setFeatureState({ source: 'parcels', id: f.id }, { hover: true });
              lastHoverId = f.id;
            }
          });
          map.on('mouseleave', 'parcels-fill', () => popup.remove());

          // Legend with descriptions and dynamic counts
          const legend = document.createElement('div');
          legend.style.cssText = 'position:absolute;right:10px;top:10px;background:#fff;border:1px solid #ddd;border-radius:8px;padding:10px 12px;font:12px/1.4 sans-serif;box-shadow:0 2px 8px rgba(0,0,0,0.08);max-height:340px;overflow:auto';
          const legendRows = [
            ['LUC','rgba(241,196,15,1)'],
            ['ONT','rgba(39,174,96,1)'],
            ['BHK','rgba(46,204,113,1)'],
            ['SKC','rgba(230,126,34,1)'],
            ['DTL','rgba(52,152,219,1)'],
            ['DGT','rgba(149,165,166,1)'],
            ['LNQ','rgba(155,89,182,1)'],
            ['NTS','rgba(26,188,156,1)'],
            ['TIN','rgba(192,57,43,1)']
          ].map(([code, color]) => {
            const desc = purposeDescriptions[code] || code;
            const count = counts[code] || 0;
            return `<div style="display:flex;align-items:center;margin:4px 0">\n              <span style="display:inline-block;width:14px;height:14px;background:${color};border:1px solid #2c3e50;border-radius:2px;margin-right:8px"></span>\n              <span><b>${code}</b> - ${desc} (${count})</span>\n            </div>`;
          }).join('');
          legend.innerHTML = `<div style="font-weight:700;margin-bottom:8px">MDSD2003 (ký hiệu)</div>${legendRows}`;
          containerRef.current.appendChild(legend);

          // Coordinate display bottom-right (EPSG:3405 like static map)
          const coordsBox = document.createElement('div');
          coordsBox.style.cssText = 'position:absolute;right:10px;bottom:10px;background:rgba(0,0,0,0.7);color:#fff;padding:6px 10px;border-radius:4px;font:12px monospace;z-index:1';
          containerRef.current.appendChild(coordsBox);
          map.on('mousemove', (evt) => {
            const { lng, lat } = evt.lngLat;
            try {
              const EPSG_3405 = '+proj=utm +zone=48 +ellps=WGS84 +units=m +no_defs +type=crs';
              const [x, y] = window.proj4(window.proj4.WGS84, EPSG_3405, [lng, lat]);
              coordsBox.textContent = `X: ${x.toFixed(2)} | Y: ${y.toFixed(2)}`;
            } catch (_) {
              coordsBox.textContent = `Lon: ${lng.toFixed(5)} | Lat: ${lat.toFixed(5)}`;
            }
          });

          // Fit to data bounds if available
          try {
            const coords = [];
            (data.features || []).forEach(ft => {
              const geom = ft && ft.geometry;
              if (!geom) return;
              const scan = (arr) => {
                arr.forEach(c => {
                  if (Array.isArray(c) && typeof c[0] === 'number' && typeof c[1] === 'number') coords.push(c);
                  else if (Array.isArray(c)) scan(c);
                });
              };
              if (geom.coordinates) scan(geom.coordinates);
            });
            if (coords.length > 0) {
              let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
              coords.forEach(([x, y]) => { if (x < minX) minX = x; if (y < minY) minY = y; if (x > maxX) maxX = x; if (y > maxY) maxY = y; });
              map.fitBounds([[minX, minY], [maxX, maxY]], { padding: 24, duration: 0 });
            }
          } catch (_) {}
        };

        if (map.loaded()) addLayers();
        else map.on('load', addLayers);
      } catch (e) {
        console.error('OnchainGISPage error:', e);
      }
    };

    return () => {
      // Cleanup
      if (mapRef.current) {
        try { mapRef.current.remove(); } catch (_) {}
      }
      const { scripts, links } = localCleanup;
      scripts.forEach(s => { try { document.body.removeChild(s); } catch (_) {} });
      links.forEach(l => { try { document.head.removeChild(l); } catch (_) {} });
    };
  }, []);

  return (
    <Card title="Bản đồ GIS (On-chain, Org1)" styles={{ body: { padding: 0 } }}>
      <div ref={containerRef} />
    </Card>
  );
};

export default OnchainGISPage;


