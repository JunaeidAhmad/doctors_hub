import { useState, useEffect } from 'react';
import { getDivisions, getDistricts, getThanas } from '../services/api/geo';

function formatGeoItem(item) {
  if (!item) return item;
  return {
    ...item,
    label: item.bn_name ? `${item.name} · ${item.bn_name}` : item.name,
  };
}

export function useDivisions() {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    getDivisions()
      .then((data) => {
        if (isMounted) {
          setItems((Array.isArray(data) ? data : []).map(formatGeoItem));
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err);
          setIsLoading(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  return { items, isLoading, error };
}

export function useDistricts(divisionId = null) {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    getDistricts(divisionId || null)
      .then((data) => {
        if (isMounted) {
          setItems((Array.isArray(data) ? data : []).map(formatGeoItem));
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err);
          setIsLoading(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, [divisionId]);

  return { items, isLoading, error };
}

export function useThanas(districtId = null) {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    if (!districtId) {
      setItems([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    getThanas(districtId)
      .then((data) => {
        if (isMounted) {
          setItems((Array.isArray(data) ? data : []).map(formatGeoItem));
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err);
          setIsLoading(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, [districtId]);

  return { items, isLoading, error };
}
