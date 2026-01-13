import React, { useState, useEffect } from 'react';
import { Search, Phone, Mail, MessageSquare, Eye, Copy, ArrowLeft, UserCheck, Download } from 'lucide-react';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { toast } from 'sonner';
import { TEXTS } from '@/content/texts';

const MENSAJEROS_STORAGE_KEY = 'onus_mensajeros';

interface Lead {
  id: string;
  nombre: string;
  empresa: string;
  telefono: string;
  email: string;
  mensaje: string;
  lead_type: 'messenger' | 'client';
  service: 'fleet' | 'logistics_staff' | 'general_contact';
  source: 'services' | 'contact_page';
  status: 'new' | 'contacted' | 'qualified' | 'onboarded' | 'discarded';
  internal_notes: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export function LeadsView() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLeadType, setFilterLeadType] = useState<string>('all');
  const [filterService, setFilterService] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Estados del detalle
  const [editedNotes, setEditedNotes] = useState('');
  const [editedStatus, setEditedStatus] = useState('');
  const [newTag, setNewTag] = useState('');

  // Estados para conversión a mensajero
  const [showConversionModal, setShowConversionModal] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');
  const [convertingLead, setConvertingLead] = useState<Lead | null>(null);

  useEffect(() => {
    fetchLeads();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [leads, searchTerm, filterLeadType, filterService, filterStatus]);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      // Cargar leads desde localStorage (100% offline)
      const stored = localStorage.getItem('onus_leads');
      if (stored) {
        const rawLeads = JSON.parse(stored);
        // Normalizar leads para asegurar que todos tengan la estructura correcta
        const normalizedLeads = rawLeads.map((lead: any) => ({
          id: lead.id || crypto.randomUUID(),
          nombre: lead.nombre || '',
          empresa: lead.empresa || '',
          telefono: lead.telefono || '',
          email: lead.email || '',
          mensaje: lead.mensaje || '',
          lead_type: lead.lead_type || 'messenger',
          service: lead.service || 'general_contact',
          source: lead.source || 'contact_page',
          status: lead.status || 'new',
          internal_notes: lead.internal_notes || '',
          tags: lead.tags || [],
          created_at: lead.created_at || lead.fecha || new Date().toISOString(),
          updated_at: lead.updated_at || lead.fecha || new Date().toISOString()
        }));
        setLeads(normalizedLeads);
      } else {
        setLeads([]);
      }
    } catch (error) {
      console.error('Error fetching leads:', error);
      toast.error(TEXTS.admin.leads.toasts.errorLoading);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...leads];

    // Filtro de búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(lead =>
        lead.nombre.toLowerCase().includes(term) ||
        lead.email.toLowerCase().includes(term) ||
        lead.telefono.includes(term) ||
        (lead.empresa && lead.empresa.toLowerCase().includes(term))
      );
    }

    // Filtro por tipo de lead
    if (filterLeadType !== 'all') {
      filtered = filtered.filter(lead => lead.lead_type === filterLeadType);
    }

    // Filtro por servicio
    if (filterService !== 'all') {
      filtered = filtered.filter(lead => lead.service === filterService);
    }

    // Filtro por estado
    if (filterStatus !== 'all') {
      filtered = filtered.filter(lead => lead.status === filterStatus);
    }

    setFilteredLeads(filtered);
  };

  const handleCopyPhone = (telefono: string) => {
    navigator.clipboard.writeText(telefono);
    toast.success(TEXTS.admin.leads.toasts.phoneCopied);
  };

  const handleCopyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    toast.success(TEXTS.admin.leads.toasts.emailCopied);
  };

  const handleWhatsApp = (lead: Lead) => {
    const firstName = lead.nombre.split(' ')[0];
    const message = TEXTS.admin.leads.whatsapp.initialTemplate
      .replace('{firstName}', firstName);
    const whatsappUrl = `https://wa.me/${lead.telefono.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleViewDetail = (lead: Lead) => {
    setSelectedLead(lead);
    setEditedNotes(lead.internal_notes);
    setEditedStatus(lead.status);
  };

  const handleUpdateLead = async () => {
    if (!selectedLead) return;

    try {
      // Actualizar lead en localStorage (100% offline)
      const stored = localStorage.getItem('onus_leads');
      if (!stored) return;

      const allLeads = JSON.parse(stored);
      const updatedLeads = allLeads.map((lead: Lead) => 
        lead.id === selectedLead.id 
          ? {
              ...lead,
              status: editedStatus,
              internal_notes: editedNotes,
              tags: selectedLead.tags,
              updated_at: new Date().toISOString()
            }
          : lead
      );

      localStorage.setItem('onus_leads', JSON.stringify(updatedLeads));
      
      toast.success(TEXTS.admin.leads.toasts.leadUpdated);
      fetchLeads();
      
      // Actualizar el lead seleccionado con los nuevos datos
      setSelectedLead({
        ...selectedLead,
        status: editedStatus as any,
        internal_notes: editedNotes,
        updated_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating lead:', error);
      toast.error(TEXTS.admin.leads.toasts.errorUpdating);
    }
  };

  const handleAddTag = () => {
    if (!selectedLead || !newTag.trim()) return;

    const updatedTags = [...selectedLead.tags, newTag.trim()];
    setSelectedLead({ ...selectedLead, tags: updatedTags });
    setNewTag('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    if (!selectedLead) return;

    const updatedTags = selectedLead.tags.filter(tag => tag !== tagToRemove);
    setSelectedLead({ ...selectedLead, tags: updatedTags });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const generateCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Omit confusing characters (I, O, 0, 1)
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleConvertToMessenger = () => {
    if (!selectedLead || selectedLead.lead_type !== 'messenger') return;

    setConvertingLead(selectedLead);
    const codigo = generateCode();
    setGeneratedCode(codigo);
    setShowConversionModal(true);
  };

  const confirmConversion = async () => {
    if (!convertingLead || !generatedCode) return;

    try {
      // Get existing mensajeros from localStorage
      const storedMensajeros = localStorage.getItem(MENSAJEROS_STORAGE_KEY);
      const mensajeros = storedMensajeros ? JSON.parse(storedMensajeros) : [];

      // Check if mensajero with this email already exists
      const existingMensajero = mensajeros.find((m: any) => m.email === convertingLead.email);
      
      if (existingMensajero) {
        toast.error(TEXTS.admin.leads.toasts.emailExists);
        setShowConversionModal(false);
        return;
      }

      // Add new mensajero
      const newMensajero = {
        codigo: generatedCode,
        nombre: convertingLead.nombre,
        email: convertingLead.email,
        telefono: convertingLead.telefono,
        fechaRegistro: new Date().toISOString(),
        activo: true
      };

      mensajeros.push(newMensajero);
      localStorage.setItem(MENSAJEROS_STORAGE_KEY, JSON.stringify(mensajeros));

      // Update lead status to onboarded
      const stored = localStorage.getItem('onus_leads');
      if (stored) {
        const allLeads = JSON.parse(stored);
        const updatedLeads = allLeads.map((lead: Lead) => 
          lead.id === convertingLead.id 
            ? {
                ...lead,
                status: 'onboarded',
                internal_notes: `${lead.internal_notes}\n[${new Date().toLocaleString('es-ES')}] Convertido a mensajero - Código: ${generatedCode}`,
                updated_at: new Date().toISOString()
              }
            : lead
        );

        localStorage.setItem('onus_leads', JSON.stringify(updatedLeads));
      }

      toast.success(TEXTS.admin.leads.toasts.messengerCreated.replace('{code}', generatedCode));
      fetchLeads();
      
      // Update selected lead
      setSelectedLead({
        ...convertingLead,
        status: 'onboarded',
        internal_notes: `${convertingLead.internal_notes}\n[${new Date().toLocaleString('es-ES')}] Convertido a mensajero - Código: ${generatedCode}`
      });
      setEditedStatus('onboarded');

    } catch (error) {
      console.error('Error converting to messenger:', error);
      toast.error(TEXTS.admin.leads.toasts.errorConverting);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(generatedCode);
    toast.success(TEXTS.admin.leads.toasts.codeCopied);
  };

  const handleSendCodeWhatsApp = () => {
    if (!convertingLead || !generatedCode) return;

    const firstName = convertingLead.nombre.split(' ')[0];
    const message = TEXTS.admin.leads.whatsapp.approvalTemplate
      .replace('{firstName}', firstName)
      .replace('{code}', generatedCode)
      .replace('{url}', window.location.origin);
    
    const whatsappUrl = `https://wa.me/34${convertingLead.telefono.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleExportToCSV = () => {
    if (filteredLeads.length === 0) {
      toast.error(TEXTS.admin.leads.toasts.noDataToExport);
      return;
    }

    try {
      // Preparar datos CSV con punto y coma como separador (formato europeo/Excel)
      const headers = [
        TEXTS.admin.leads.csv.headers.date,
        TEXTS.admin.leads.csv.headers.name,
        TEXTS.admin.leads.csv.headers.company,
        TEXTS.admin.leads.csv.headers.email,
        TEXTS.admin.leads.csv.headers.phone,
        TEXTS.admin.leads.csv.headers.leadType,
        TEXTS.admin.leads.csv.headers.service,
        TEXTS.admin.leads.csv.headers.source,
        TEXTS.admin.leads.csv.headers.status,
        TEXTS.admin.leads.csv.headers.message,
        TEXTS.admin.leads.csv.headers.internalNotes,
        TEXTS.admin.leads.csv.headers.tags
      ];
      
      const rows = filteredLeads.map(lead => [
        new Date(lead.created_at).toLocaleDateString('es-ES', { 
          day: '2-digit', 
          month: '2-digit', 
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        lead.nombre,
        lead.empresa || '',
        lead.email,
        lead.telefono,
        TEXTS.admin.leads.leadTypes[lead.lead_type],
        TEXTS.admin.leads.services[lead.service],
        lead.source === 'services' ? TEXTS.admin.leads.sources.services : TEXTS.admin.leads.sources.contact,
        TEXTS.admin.leads.statuses[lead.status],
        lead.mensaje || '',
        lead.internal_notes || '',
        lead.tags.join(', ')
      ]);

      // Crear contenido CSV
      const csvHeaderLine = headers.map(h => `"${h}"`).join(';');
      const csvDataLines = rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(';'));
      const csvContent = [csvHeaderLine, ...csvDataLines].join('\n');

      // Añadir BOM para que Excel reconozca UTF-8
      const BOM = '\uFEFF';
      const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
      
      // Crear enlace de descarga
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Nombre de archivo con fecha
      const fecha = new Date().toISOString().split('T')[0];
      link.download = `ONUS_Leads_${fecha}.csv`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(TEXTS.admin.leads.toasts.exportSuccess.replace('{count}', String(filteredLeads.length)));
    } catch (error) {
      console.error('Error exportando CSV:', error);
      toast.error(TEXTS.admin.leads.toasts.exportError);
    }
  };

  const STATUS_COLORS = {
    new: '#00C9CE',
    contacted: '#FFA500',
    qualified: '#4CAF50',
    onboarded: '#2196F3',
    discarded: '#9E9E9E'
  };

  // Vista de detalle
  if (selectedLead) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <button
              onClick={() => setSelectedLead(null)}
              className="flex items-center gap-2 text-gray-600 hover:text-[#00C9CE] mb-4"
            >
              <ArrowLeft className="w-5 h-5" />
              {TEXTS.admin.leads.actions.backToList}
            </button>
            <h2 className="text-2xl mb-2" style={{ color: '#000935' }}>
              {selectedLead.nombre}
            </h2>
            <div className="flex gap-2">
              <span
                className="px-3 py-1 rounded-full text-sm text-white"
                style={{ backgroundColor: '#00C9CE' }}
              >
                {TEXTS.admin.leads.leadTypes[selectedLead.lead_type]}
              </span>
              <span
                className="px-3 py-1 rounded-full text-sm text-white"
                style={{ backgroundColor: '#000935' }}
              >
                {TEXTS.admin.leads.services[selectedLead.service]}
              </span>
              <span
                className="px-3 py-1 rounded-full text-sm text-white"
                style={{ backgroundColor: STATUS_COLORS[selectedLead.status] }}
              >
                {TEXTS.admin.leads.statuses[selectedLead.status]}
              </span>
            </div>
          </div>

          {/* Acciones rápidas */}
          <div className="flex gap-2">
            <button
              onClick={() => handleCopyPhone(selectedLead.telefono)}
              className="p-2 border rounded-lg hover:bg-gray-50"
              title={TEXTS.admin.leads.tooltips.copyPhone}
            >
              <Phone className="w-5 h-5" style={{ color: '#00C9CE' }} />
            </button>
            <button
              onClick={() => handleWhatsApp(selectedLead)}
              className="p-2 border rounded-lg hover:bg-gray-50"
              title={TEXTS.admin.leads.tooltips.sendWhatsApp}
            >
              <MessageSquare className="w-5 h-5" style={{ color: '#00C9CE' }} />
            </button>
            <button
              onClick={() => handleCopyEmail(selectedLead.email)}
              className="p-2 border rounded-lg hover:bg-gray-50"
              title={TEXTS.admin.leads.tooltips.copyEmail}
            >
              <Mail className="w-5 h-5" style={{ color: '#00C9CE' }} />
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Columna izquierda: Datos enviados */}
          <div className="bg-white p-6 rounded-lg border">
            <h3 className="text-lg mb-4" style={{ color: '#000935' }}>
              {TEXTS.admin.leads.titles.submittedData}
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">{TEXTS.admin.leads.labels.name}</p>
                <p className="text-gray-900">{selectedLead.nombre}</p>
              </div>
              {selectedLead.empresa && (
                <div>
                  <p className="text-sm text-gray-500">{TEXTS.admin.leads.labels.company}</p>
                  <p className="text-gray-900">{selectedLead.empresa}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-500">{TEXTS.admin.leads.labels.phone}</p>
                <p className="text-gray-900">{selectedLead.telefono}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">{TEXTS.admin.leads.labels.email}</p>
                <p className="text-gray-900">{selectedLead.email}</p>
              </div>
              {selectedLead.mensaje && (
                <div>
                  <p className="text-sm text-gray-500">{TEXTS.admin.leads.labels.message}</p>
                  <p className="text-gray-900 whitespace-pre-wrap">{selectedLead.mensaje}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-500">{TEXTS.admin.leads.labels.source}</p>
                <p className="text-gray-900">
                  {selectedLead.source === 'services' ? TEXTS.admin.leads.sources.servicesPage : TEXTS.admin.leads.sources.contactPage}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">{TEXTS.admin.leads.labels.requestDate}</p>
                <p className="text-gray-900">{formatDate(selectedLead.created_at)}</p>
              </div>
            </div>
          </div>

          {/* Columna derecha: Gestión interna */}
          <div className="space-y-6">
            {/* Estado */}
            <div className="bg-white p-6 rounded-lg border">
              <h3 className="text-lg mb-4" style={{ color: '#000935' }}>
                {TEXTS.admin.leads.titles.state}
              </h3>
              <select
                value={editedStatus}
                onChange={(e) => setEditedStatus(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00C9CE]"
              >
                <option value="new">{TEXTS.admin.leads.statuses.new}</option>
                <option value="contacted">{TEXTS.admin.leads.statuses.contacted}</option>
                <option value="qualified">{TEXTS.admin.leads.statuses.qualified}</option>
                <option value="onboarded">{TEXTS.admin.leads.statuses.onboarded}</option>
                <option value="discarded">{TEXTS.admin.leads.statuses.discarded}</option>
              </select>
            </div>

            {/* Notas internas */}
            <div className="bg-white p-6 rounded-lg border">
              <h3 className="text-lg mb-4" style={{ color: '#000935' }}>
                {TEXTS.admin.leads.titles.internalNotes}
              </h3>
              <textarea
                value={editedNotes}
                onChange={(e) => setEditedNotes(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00C9CE] resize-none"
                rows={5}
                placeholder={TEXTS.admin.leads.placeholders.notes}
              />
            </div>

            {/* Tags */}
            <div className="bg-white p-6 rounded-lg border">
              <h3 className="text-lg mb-4" style={{ color: '#000935' }}>
                {TEXTS.admin.leads.titles.tags}
              </h3>
              <div className="flex gap-2 mb-3 flex-wrap">
                {selectedLead.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 rounded-full text-sm flex items-center gap-2"
                    style={{ backgroundColor: '#00C9CE20', color: '#000935' }}
                  >
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-red-500"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                  className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00C9CE]"
                  placeholder={TEXTS.admin.leads.placeholders.newTag}
                />
                <button
                  onClick={handleAddTag}
                  className="px-4 py-2 rounded-lg text-white"
                  style={{ backgroundColor: '#00C9CE' }}
                >
                  {TEXTS.admin.leads.actions.addTag}
                </button>
              </div>
            </div>

            {/* Botón guardar */}
            <button
              onClick={handleUpdateLead}
              className="w-full px-6 py-3 rounded-lg text-white transition-all hover:scale-105"
              style={{ backgroundColor: '#00C9CE', color: '#000935' }}
            >
              {TEXTS.admin.leads.actions.save}
            </button>

            {/* Botón aprobar como mensajero */}
            {selectedLead.lead_type === 'messenger' && selectedLead.status !== 'onboarded' && (
              <button
                onClick={handleConvertToMessenger}
                className="w-full px-6 py-3 rounded-lg text-white transition-all hover:scale-105 flex items-center justify-center gap-2"
                style={{ backgroundColor: '#4CAF50', color: 'white' }}
              >
                <UserCheck className="w-5 h-5" />
                {TEXTS.admin.leads.actions.approveAsMessenger}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Vista de listado
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl mb-2" style={{ color: '#000935' }}>
          {TEXTS.admin.leads.title}
        </h2>
        <p className="text-gray-600">
          {TEXTS.admin.leads.subtitle}
        </p>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg border">
        <div className="flex items-center justify-between gap-4 mb-4">
          <p className="text-sm text-gray-600">
            {TEXTS.admin.leads.summary.showingPrefix} {filteredLeads.length} {TEXTS.admin.leads.summary.showingOf} {leads.length} {TEXTS.admin.leads.summary.showingSuffix}
          </p>
          <button
            onClick={handleExportToCSV}
            disabled={filteredLeads.length === 0}
            className="px-4 py-2 rounded-lg border-[#00C9CE] text-[#00C9CE] hover:bg-[#00C9CE] hover:text-white transition-colors flex items-center gap-2 border disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            {TEXTS.admin.leads.actions.exportCSV}
          </button>
        </div>
        <div className="grid md:grid-cols-4 gap-4">
          {/* Búsqueda */}
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={TEXTS.admin.leads.filters.searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00C9CE]"
            />
          </div>

          {/* Filtro tipo de lead */}
          <select
            value={filterLeadType}
            onChange={(e) => setFilterLeadType(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00C9CE]"
          >
            <option value="all">{TEXTS.admin.leads.filters.allTypes}</option>
            <option value="messenger">{TEXTS.admin.leads.leadTypes.messenger}</option>
            <option value="client">{TEXTS.admin.leads.leadTypes.client}</option>
          </select>

          {/* Filtro servicio */}
          <select
            value={filterService}
            onChange={(e) => setFilterService(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00C9CE]"
          >
            <option value="all">{TEXTS.admin.leads.filters.allServices}</option>
            <option value="fleet">{TEXTS.admin.leads.services.fleet}</option>
            <option value="logistics_staff">{TEXTS.admin.leads.services.logistics_staff}</option>
            <option value="general_contact">{TEXTS.admin.leads.services.general_contact}</option>
          </select>

          {/* Filtro estado */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00C9CE]"
          >
            <option value="all">{TEXTS.admin.leads.filters.allStatuses}</option>
            <option value="new">{TEXTS.admin.leads.statuses.new}</option>
            <option value="contacted">{TEXTS.admin.leads.statuses.contacted}</option>
            <option value="qualified">{TEXTS.admin.leads.statuses.qualified}</option>
            <option value="onboarded">{TEXTS.admin.leads.statuses.onboarded}</option>
            <option value="discarded">{TEXTS.admin.leads.statuses.discarded}</option>
          </select>
        </div>
      </div>

      {/* Tabla */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">
          {TEXTS.admin.leads.states.loading}
        </div>
      ) : filteredLeads.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          {searchTerm || filterLeadType !== 'all' || filterService !== 'all' || filterStatus !== 'all'
            ? TEXTS.admin.leads.states.emptyWithFilters
            : TEXTS.admin.leads.states.emptyNoFilters}
        </div>
      ) : (
        <div className="bg-white rounded-lg border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead style={{ backgroundColor: '#f8f9fa' }}>
                <tr>
                  <th className="px-4 py-3 text-left text-sm text-gray-600">{TEXTS.admin.leads.tableHeaders.date}</th>
                  <th className="px-4 py-3 text-left text-sm text-gray-600">{TEXTS.admin.leads.tableHeaders.nameCompany}</th>
                  <th className="px-4 py-3 text-left text-sm text-gray-600">{TEXTS.admin.leads.tableHeaders.phone}</th>
                  <th className="px-4 py-3 text-left text-sm text-gray-600">{TEXTS.admin.leads.tableHeaders.type}</th>
                  <th className="px-4 py-3 text-left text-sm text-gray-600">{TEXTS.admin.leads.tableHeaders.service}</th>
                  <th className="px-4 py-3 text-left text-sm text-gray-600">{TEXTS.admin.leads.tableHeaders.status}</th>
                  <th className="px-4 py-3 text-left text-sm text-gray-600">{TEXTS.admin.leads.tableHeaders.actions}</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map((lead) => (
                  <tr key={lead.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(lead.created_at).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: '2-digit'
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm" style={{ color: '#000935' }}>{lead.nombre}</p>
                        {lead.empresa && (
                          <p className="text-xs text-gray-500">{lead.empresa}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {lead.telefono}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="px-2 py-1 rounded-full text-xs text-white"
                        style={{ backgroundColor: '#00C9CE' }}
                      >
                        {TEXTS.admin.leads.leadTypes[lead.lead_type]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="px-2 py-1 rounded-full text-xs text-white"
                        style={{ backgroundColor: '#000935' }}
                      >
                        {TEXTS.admin.leads.services[lead.service]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="px-2 py-1 rounded-full text-xs text-white"
                        style={{ backgroundColor: STATUS_COLORS[lead.status] }}
                      >
                        {TEXTS.admin.leads.statuses[lead.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleCopyPhone(lead.telefono)}
                          className="p-1 hover:bg-gray-100 rounded"
                          title={TEXTS.admin.leads.tooltips.copyPhone}
                        >
                          <Copy className="w-4 h-4" style={{ color: '#00C9CE' }} />
                        </button>
                        <button
                          onClick={() => handleWhatsApp(lead)}
                          className="p-1 hover:bg-gray-100 rounded"
                          title={TEXTS.admin.leads.tooltips.whatsApp}
                        >
                          <MessageSquare className="w-4 h-4" style={{ color: '#00C9CE' }} />
                        </button>
                        <button
                          onClick={() => handleViewDetail(lead)}
                          className="p-1 hover:bg-gray-100 rounded"
                          title={TEXTS.admin.leads.tooltips.viewDetail}
                        >
                          <Eye className="w-4 h-4" style={{ color: '#00C9CE' }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal de conversión a mensajero */}
      {showConversionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserCheck className="w-8 h-8 text-green-600" />
              </div>
              
              <h3 className="text-2xl mb-2" style={{ color: '#000935', fontFamily: 'REM, sans-serif', fontWeight: 500 }}>
                {TEXTS.admin.leads.modal.approvedTitle}
              </h3>
              
              <p className="text-gray-600 mb-6">
                {TEXTS.admin.leads.modal.approvedSubtitle.replace('{name}', convertingLead?.nombre || '')}
              </p>

              <div className="bg-gray-50 rounded-xl p-6 mb-6">
                <p className="text-sm text-gray-600 mb-2">{TEXTS.admin.leads.modal.codeLabel}</p>
                <div className="flex items-center justify-center gap-3">
                  <p className="text-3xl tracking-widest" style={{ 
                    color: '#00C9CE',
                    fontFamily: 'monospace',
                    fontWeight: 700
                  }}>
                    {generatedCode}
                  </p>
                  <button
                    onClick={handleCopyCode}
                    className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                    title={TEXTS.admin.leads.tooltips.copyCode}
                  >
                    <Copy className="w-5 h-5" style={{ color: '#00C9CE' }} />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => {
                    confirmConversion();
                    setShowConversionModal(false);
                  }}
                  className="w-full px-6 py-3 rounded-lg text-white transition-all hover:scale-105"
                  style={{ backgroundColor: '#4CAF50' }}
                >
                  {TEXTS.admin.leads.actions.confirmAndSave}
                </button>

                <button
                  onClick={() => {
                    confirmConversion();
                    handleSendCodeWhatsApp();
                    setShowConversionModal(false);
                  }}
                  className="w-full px-6 py-3 rounded-lg transition-all hover:scale-105 flex items-center justify-center gap-2"
                  style={{ backgroundColor: '#00C9CE', color: '#000935' }}
                >
                  <MessageSquare className="w-5 h-5" />
                  {TEXTS.admin.leads.actions.sendCodeWhatsApp}
                </button>

                <button
                  onClick={() => {
                    setShowConversionModal(false);
                    setGeneratedCode('');
                    setConvertingLead(null);
                  }}
                  className="w-full px-6 py-3 rounded-lg border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition-all"
                >
                  {TEXTS.admin.leads.actions.cancel}
                </button>
              </div>

              <p className="text-xs text-gray-500 mt-4">
                {TEXTS.admin.leads.modal.accessInfo}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}