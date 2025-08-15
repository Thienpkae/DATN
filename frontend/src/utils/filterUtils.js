// Utility functions for filtering and search functionality

// Filter land parcels by multiple criteria
export const filterLandParcels = (landParcels, filters) => {
  if (!landParcels || !Array.isArray(landParcels)) return [];
  if (!filters || Object.keys(filters).length === 0) return landParcels;

  return landParcels.filter(parcel => {
    // Filter by keyword (search in multiple fields)
    if (filters.keyword) {
      const keyword = filters.keyword.toLowerCase();
      const searchableFields = [
        parcel.id,
        parcel.ownerID,
        parcel.location,
        parcel.landUsePurpose,
        parcel.legalStatus,
        parcel.certificateID
      ].map(field => String(field || '')).join(' ').toLowerCase();
      
      if (!searchableFields.includes(keyword)) {
        return false;
      }
    }

    // Filter by location
    if (filters.location && parcel.location) {
      if (!parcel.location.toLowerCase().includes(filters.location.toLowerCase())) {
        return false;
      }
    }

    // Filter by land use purpose
    if (filters.landUsePurpose && parcel.landUsePurpose) {
      if (parcel.landUsePurpose !== filters.landUsePurpose) {
        return false;
      }
    }

    // Filter by legal status
    if (filters.legalStatus && parcel.legalStatus) {
      if (parcel.legalStatus !== filters.legalStatus) {
        return false;
      }
    }

    // Filter by area range
    if (filters.minArea && parcel.area) {
      if (parcel.area < filters.minArea) {
        return false;
      }
    }
    if (filters.maxArea && parcel.area) {
      if (parcel.area > filters.maxArea) {
        return false;
      }
    }

    // Filter by owner ID
    if (filters.ownerID && parcel.ownerID) {
      if (parcel.ownerID !== filters.ownerID) {
        return false;
      }
    }

    // Filter by certificate status
    if (filters.hasCertificate !== undefined) {
      const hasCert = !!parcel.certificateID;
      if (hasCert !== filters.hasCertificate) {
        return false;
      }
    }

    // Filter by date range
    if (filters.dateFrom && parcel.createdAt) {
      const createdDate = new Date(parcel.createdAt);
      const fromDate = new Date(filters.dateFrom);
      if (createdDate < fromDate) {
        return false;
      }
    }
    if (filters.dateTo && parcel.createdAt) {
      const createdDate = new Date(parcel.createdAt);
      const toDate = new Date(filters.dateTo);
      if (createdDate > toDate) {
        return false;
      }
    }

    return true;
  });
};

// Sort land parcels by various criteria
export const sortLandParcels = (landParcels, sortBy = 'createdAt', sortOrder = 'desc') => {
  if (!landParcels || !Array.isArray(landParcels)) return [];

  const sortedParcels = [...landParcels];

  sortedParcels.sort((a, b) => {
    let aValue = a[sortBy];
    let bValue = b[sortBy];

    // Handle different data types
    if (sortBy === 'area') {
      aValue = parseFloat(aValue) || 0;
      bValue = parseFloat(bValue) || 0;
    } else if (sortBy === 'createdAt' || sortBy === 'updatedAt' || sortBy === 'issueDate') {
      aValue = new Date(aValue || 0);
      bValue = new Date(bValue || 0);
    } else {
      aValue = String(aValue || '').toLowerCase();
      bValue = String(bValue || '').toLowerCase();
    }

    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
    } else {
      return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
    }
  });

  return sortedParcels;
};

// Build search query parameters for API
export const buildSearchParams = (filters, page = 1, pageSize = 10) => {
  const params = new URLSearchParams();

  // Add pagination
  params.append('page', page.toString());
  params.append('pageSize', pageSize.toString());

  // Add filters
  if (filters.keyword) {
    params.append('keyword', filters.keyword);
  }

  if (filters.location) {
    params.append('location', filters.location);
  }

  if (filters.landUsePurpose) {
    params.append('landUsePurpose', filters.landUsePurpose);
  }

  if (filters.legalStatus) {
    params.append('legalStatus', filters.legalStatus);
  }

  if (filters.minArea) {
    params.append('minArea', filters.minArea.toString());
  }

  if (filters.maxArea) {
    params.append('maxArea', filters.maxArea.toString());
  }

  if (filters.ownerID) {
    params.append('ownerID', filters.ownerID);
  }

  if (filters.hasCertificate !== undefined) {
    params.append('hasCertificate', filters.hasCertificate.toString());
  }

  if (filters.dateFrom) {
    params.append('dateFrom', filters.dateFrom);
  }

  if (filters.dateTo) {
    params.append('dateTo', filters.dateTo);
  }

  return params.toString();
};

// Parse search parameters from URL
export const parseSearchParams = (searchString) => {
  const params = new URLSearchParams(searchString);
  const filters = {};

  // Parse pagination
  const page = parseInt(params.get('page')) || 1;
  const pageSize = parseInt(params.get('pageSize')) || 10;

  // Parse filters
  if (params.get('keyword')) filters.keyword = params.get('keyword');
  if (params.get('location')) filters.location = params.get('location');
  if (params.get('landUsePurpose')) filters.landUsePurpose = params.get('landUsePurpose');
  if (params.get('legalStatus')) filters.legalStatus = params.get('legalStatus');
  if (params.get('minArea')) filters.minArea = parseFloat(params.get('minArea'));
  if (params.get('maxArea')) filters.maxArea = parseFloat(params.get('maxArea'));
  if (params.get('ownerID')) filters.ownerID = params.get('ownerID');
  if (params.get('hasCertificate')) {
    filters.hasCertificate = params.get('hasCertificate') === 'true';
  }
  if (params.get('dateFrom')) filters.dateFrom = params.get('dateFrom');
  if (params.get('dateTo')) filters.dateTo = params.get('dateTo');

  return { filters, page, pageSize };
};

// Get available filter options
export const getFilterOptions = (landParcels) => {
  if (!landParcels || !Array.isArray(landParcels)) {
    return {
      landUsePurposes: [],
      legalStatuses: [],
      locations: [],
      minArea: 0,
      maxArea: 0
    };
  }

  const landUsePurposes = [...new Set(landParcels.map(p => p.landUsePurpose).filter(Boolean))];
  const legalStatuses = [...new Set(landParcels.map(p => p.legalStatus).filter(Boolean))];
  const locations = [...new Set(landParcels.map(p => p.location).filter(Boolean))];
  
  const areas = landParcels.map(p => p.area).filter(area => area && area > 0);
  const minArea = areas.length > 0 ? Math.min(...areas) : 0;
  const maxArea = areas.length > 0 ? Math.max(...areas) : 0;

  return {
    landUsePurposes: landUsePurposes.sort(),
    legalStatuses: legalStatuses.sort(),
    locations: locations.sort(),
    minArea,
    maxArea
  };
};

// Validate filter values
export const validateFilters = (filters) => {
  const errors = [];

  if (filters.minArea && filters.maxArea) {
    if (filters.minArea > filters.maxArea) {
      errors.push('Diện tích tối thiểu không thể lớn hơn diện tích tối đa');
    }
  }

  if (filters.dateFrom && filters.dateTo) {
    const fromDate = new Date(filters.dateFrom);
    const toDate = new Date(filters.dateTo);
    if (fromDate > toDate) {
      errors.push('Ngày bắt đầu không thể muộn hơn ngày kết thúc');
    }
  }

  if (filters.minArea && filters.minArea < 0) {
    errors.push('Diện tích tối thiểu không thể âm');
  }

  if (filters.maxArea && filters.maxArea < 0) {
    errors.push('Diện tích tối đa không thể âm');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Reset filters to default values
export const getDefaultFilters = () => {
  return {
    keyword: '',
    location: '',
    landUsePurpose: '',
    legalStatus: '',
    minArea: '',
    maxArea: '',
    ownerID: '',
    hasCertificate: undefined,
    dateFrom: '',
    dateTo: ''
  };
};
