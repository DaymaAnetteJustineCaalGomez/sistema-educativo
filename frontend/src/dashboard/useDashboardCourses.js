// frontend/src/dashboard/useDashboardCourses.js
import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../api.js';
import { parseGrado } from '../utils/user.js';

export default function useDashboardCourses(initialGrade) {
  const normalizedInitial = parseGrado(initialGrade) || null;
  const [grade, setGrade] = useState(normalizedInitial || 1);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const abortRef = useRef(null);

  const fetchCourses = useCallback(
    async (targetGrade = grade) => {
      const normalized = parseGrado(targetGrade);
      if (!normalized) {
        setCourses([]);
        setError('');
        setLoading(false);
        return;
      }

      setGrade(normalized);
      setLoading(true);
      setError('');

      abortRef.current?.abort?.();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const data = await api.cursosBasico(normalized, { signal: controller.signal });
        if (!controller.signal.aborted) {
          setCourses(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setCourses([]);
          setError(err.message || 'No se pudieron cargar los cursos.');
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    },
    [grade],
  );

  useEffect(() => {
    const normalized = parseGrado(initialGrade);
    if (!normalized) {
      setCourses([]);
      setError('');
      setLoading(false);
      return;
    }
    fetchCourses(normalized);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialGrade]);

  useEffect(() => () => abortRef.current?.abort?.(), []);

  return { grade, courses, loading, error, refresh: fetchCourses };
}
