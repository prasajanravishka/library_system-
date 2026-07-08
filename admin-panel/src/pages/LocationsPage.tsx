/* ══════════════════════════════════════════════════════════════════════════
   Locations Page — CRUD operations for Locations
   ══════════════════════════════════════════════════════════════════════════ */

import { useEffect, useState, useMemo } from 'react';
import { Search, MapPin, Plus, Edit2, Trash2 } from 'lucide-react';
import { locationsApi } from '../api/locations.api';
import type { Location } from '../types/location.types';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { Skeleton } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import Modal from '../components/ui/Modal';
import LocationForm, { type LocationFormData } from '../components/forms/LocationForm';
import { getErrorMessage } from '../lib/utils';
import { toast } from 'sonner';

/**
 * LocationsPage Component
 * 
 * Manages physical locations within the library (e.g., shelves, floors, sections).
 * Provides a data table with search and filtering, plus CRUD operations via modals.
 */
export default function LocationsPage() {
  // State for storing location data and managing UI feedback
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // State variables for the add/edit location modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetches all library locations from the backend API
  const fetchLocations = async () => {
    try {
      const data = await locationsApi.getAll();
      setLocations(data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  // Memoized array of locations filtered by search query matching name or floor
  const filteredLocations = useMemo(() => {
    return locations.filter((l) =>
      !searchQuery ||
      l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.floor && l.floor.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [locations, searchQuery]);

  const handleAddLocation = () => {
    setEditingLocation(null);
    setIsModalOpen(true);
  };

  const handleEditLocation = (location: Location) => {
    setEditingLocation(location);
    setIsModalOpen(true);
  };

  const handleDeleteLocation = async (locationId: number) => {
    if (!window.confirm('Are you sure you want to delete this location?')) return;
    try {
      await locationsApi.delete(locationId);
      setLocations((prev) => prev.filter((l) => l.location_id !== locationId));
      toast.success('Location deleted successfully');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleFormSubmit = async (data: LocationFormData) => {
    setIsSubmitting(true);
    try {
      if (editingLocation) {
        const updated = await locationsApi.update(editingLocation.location_id, data);
        setLocations((prev) => prev.map((l) => (l.location_id === editingLocation.location_id ? updated : l)));
        toast.success('Location updated successfully');
      } else {
        const created = await locationsApi.create(data);
        setLocations((prev) => [...prev, created]);
        toast.success('Location created successfully');
      }
      setIsModalOpen(false);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Locations</h1>
          <p className="text-sm text-slate-500 mt-1">Manage physical locations</p>
        </div>
        <div className="flex gap-4 mb-6">
          <Skeleton className="h-10 w-64 rounded-xl" />
        </div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Locations</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage physical locations in the library · {locations.length} total
          </p>
        </div>
        <button
          onClick={handleAddLocation}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-sm font-semibold rounded-xl hover:shadow-lg hover:shadow-indigo-500/25 transition-all duration-300 active:scale-[0.98]"
        >
          <Plus size={18} />
          Add Location
        </button>
      </div>

      {/* ── Filters ───────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
        <div className="relative flex-1 w-full sm:min-w-[260px] sm:max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or floor…"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
          />
        </div>
      </div>

      {/* ── Table ─────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto overflow-y-auto max-h-[600px] custom-scrollbar">
          {filteredLocations.length === 0 ? (
            <EmptyState 
              icon={MapPin} 
              title="No locations found" 
              description="Adjust your search or add a new location." 
            />
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-white/95 backdrop-blur-md shadow-sm">
                <tr className="border-b border-slate-200">
                  {['Location Name', 'Floor', 'Description', 'Actions'].map((col) => (
                    <th
                      key={col}
                      className="text-left py-3.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredLocations.map((location) => (
                  <tr
                    key={location.location_id}
                    className="hover:bg-slate-50 border-b border-slate-100 transition-colors group"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 shrink-0">
                          <MapPin size={16} className="text-indigo-600" />
                        </div>
                        <span className="font-medium text-slate-900">{location.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {location.floor || '—'}
                    </td>
                    <td className="py-3 px-4 text-slate-500 max-w-[250px] truncate">
                      {location.description || '—'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEditLocation(location)}
                          className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all duration-200"
                          title="Edit location"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteLocation(location.location_id)}
                          className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all duration-200"
                          title="Delete location"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200">
          <p className="text-xs text-slate-500">
            Showing {filteredLocations.length} of {locations.length} locations
          </p>
        </div>
      </div>

      {/* ── Location Form Modal ───────────────────────────────────────── */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => !isSubmitting && setIsModalOpen(false)}
        title={editingLocation ? 'Edit Location' : 'Add New Location'}
        size="md"
      >
        <LocationForm location={editingLocation} onSubmit={handleFormSubmit} isSubmitting={isSubmitting} />
      </Modal>
    </div>
  );
}
