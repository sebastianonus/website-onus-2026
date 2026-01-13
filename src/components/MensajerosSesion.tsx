import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { LogOut, MapPin, Clock, Calendar, Truck, DollarSign, Info, ChevronDown, ChevronUp, Search, Eye, X, MessageCircle, FileText } from 'lucide-react';
import { Label } from './ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Slider } from './ui/slider';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import backgroundImage from 'figma:asset/4261f3db5c66ef3456a8ebcae9838917a1e10ea5.png';
import onusLogo from 'figma:asset/e80d7ef4ac3b9441721d6916cfc8ad34baf40db1.png';
import { toast } from 'sonner';
import { CampanaCard } from './CampanaCard';
import { TEXTS } from '@/content/texts';

// Ciudades principales de España
const CIUDADES = [
  'Madrid',
  'Barcelona',
  'Valencia',
  'Sevilla',
  'Zaragoza',
  'Málaga',
  'Murcia',
  'Palma',
  'Las Palmas',
  'Bilbao',
  'Alicante',
  'Córdoba',
  'Valladolid',
  'Vigo',
  'Gijón',
  'Hospitalet de Llobregat',
  'A Coruña',
  'Granada',
  'Vitoria',
  'Elche',
  'Oviedo',
  'Santa Cruz de Tenerife',
  'Badalona',
  'Cartagena',
  'Terrassa',
  'Jerez de la Frontera',
  'Sabadell',
  'Móstoles',
  'Alcalá de Henares',
  'Pamplona'
].sort();

interface MensajeroAuth {
  codigo: string;
  nombre: string;
  email: string;
  telefono: string;
  activo: boolean;
  fechaLogin: string;
  filtros?: {
    ciudad: string;
    radioKm: number;
    vehiculo: string;
    horario: string;
    jornada: string;
  };
}

interface Campana {
  id: string;
  nombre: string;
  descripcion: string;
  ciudad: string;
  vehiculo: string;
  horario: string;
  jornada: string;
  pago: string;
  fechaInicio: string;
  fechaFin: string;
  activa: boolean;
}

// Interface para las campañas del AdminPanel
interface AdminCampaign {
  id: string;
  titulo: string;
  logoUrl?: string;
  ciudad: string;
  tarifa: string;
  descripcion?: string;
  createdAt: string;
  vehiculos: string[];
  flotista: string[];
  mensajero: string[];
  isActive: boolean;
  cliente?: string;
}

// Función para convertir AdminCampaign a Campana con toda la información
const convertAdminCampaignToCampana = (adminCampaign: AdminCampaign): Campana & { logoUrl?: string; vehiculos: string[]; requisitos: string[] } => {
  return {
    id: adminCampaign.id,
    nombre: adminCampaign.titulo,
    descripcion: adminCampaign.descripcion || 'Sin descripción',
    ciudad: adminCampaign.ciudad,
    vehiculo: adminCampaign.vehiculos.length > 0 ? adminCampaign.vehiculos.join(', ') : 'Todos',
    horario: 'Todos',
    jornada: 'Todas',
    pago: adminCampaign.tarifa,
    fechaInicio: adminCampaign.createdAt,
    fechaFin: adminCampaign.createdAt,
    activa: adminCampaign.isActive,
    logoUrl: adminCampaign.logoUrl,
    vehiculos: adminCampaign.vehiculos,
    requisitos: adminCampaign.mensajero || []
  };
};

export function MensajerosSesion() {
  const navigate = useNavigate();
  const [mensajero, setMensajero] = useState<MensajeroAuth | null>(null);
  const [campanas, setCampanas] = useState<Campana[]>([]);
  const [campanasFiltradas, setCampanasFiltradas] = useState<Campana[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  
  // Filter states
  const [ciudad, setCiudad] = useState('');
  const [radioKm, setRadioKm] = useState([50]);
  const [vehiculo, setVehiculo] = useState('');
  const [horario, setHorario] = useState('');
  const [jornada, setJornada] = useState('');

  // Postulaciones state
  const [postulaciones, setPostulaciones] = useState<string[]>([]);

  // Modal states
  const [selectedCampaign, setSelectedCampaign] = useState<Campana | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    motivacion: '',
    experiencia: '',
    disponibilidad: ''
  });

  useEffect(() => {
    // Check authentication on component mount
    const authData = localStorage.getItem('mensajero_auth');
    
    if (!authData) {
      navigate('/mensajeros/acceso');
      return;
    }

    try {
      const parsedAuth: MensajeroAuth = JSON.parse(authData);
      setMensajero(parsedAuth);
      
      // Load postulaciones del mensajero
      const storedPostulaciones = localStorage.getItem('onus_postulaciones');
      if (storedPostulaciones) {
        const allPostulaciones = JSON.parse(storedPostulaciones);
        // Filtrar solo las postulaciones de este mensajero
        const misPostulaciones = allPostulaciones
          .filter((p: any) => p.mensajeroCodigo === parsedAuth.codigo)
          .map((p: any) => p.campanaId);
        setPostulaciones(misPostulaciones);
      }
      
      // Initialize filter states with saved values
      if (parsedAuth.filtros) {
        setCiudad(parsedAuth.filtros.ciudad || '');
        setRadioKm([parsedAuth.filtros.radioKm || 50]);
        setVehiculo(parsedAuth.filtros.vehiculo || '');
        setHorario(parsedAuth.filtros.horario || '');
        setJornada(parsedAuth.filtros.jornada || '');
      }
      
      // Load campañas from localStorage
      const storedCampanas = localStorage.getItem('onus_campaigns');
      console.log('🔍 DEBUG: storedCampanas raw:', storedCampanas);
      if (storedCampanas) {
        const allCampanas: AdminCampaign[] = JSON.parse(storedCampanas);
        console.log('🔍 DEBUG: Todas las campañas:', allCampanas);
        console.log('🔍 DEBUG: Número total de campañas:', allCampanas.length);
        
        // Solo campañas activas
        const activeCampanas = allCampanas.filter(c => c.isActive).map(convertAdminCampaignToCampana);
        console.log('🔍 DEBUG: Campañas activas convertidas:', activeCampanas);
        console.log('🔍 DEBUG: Número de campañas activas:', activeCampanas.length);
        
        setCampanas(activeCampanas);
        
        // Aplicar filtros
        if (parsedAuth.filtros) {
          console.log('🔍 DEBUG: Filtros del mensajero:', parsedAuth.filtros);
          const filtered = filterCampanas(activeCampanas, parsedAuth.filtros);
          console.log('🔍 DEBUG: Campañas después de filtrar:', filtered);
          console.log('🔍 DEBUG: Número de campañas filtradas:', filtered.length);
          setCampanasFiltradas(filtered);
        } else {
          console.log('🔍 DEBUG: No hay filtros, mostrando todas las activas');
          setCampanasFiltradas(activeCampanas);
        }
      } else {
        console.log('❌ DEBUG: No hay campañas en localStorage');
      }
    } catch (error) {
      console.error('Error parsing auth data:', error);
      navigate('/mensajeros/acceso');
    }
  }, [navigate]);

  const filterCampanas = (campanas: Campana[], filtros: MensajeroAuth['filtros']) => {
    if (!filtros) return campanas;

    return campanas.filter(campana => {
      // Filtro de ciudad
      if (filtros.ciudad && filtros.ciudad !== 'Todas') {
        if (campana.ciudad !== filtros.ciudad) return false;
      }

      // Filtro de vehículo
      if (filtros.vehiculo && filtros.vehiculo !== 'Todos') {
        if (campana.vehiculo !== 'Todos' && campana.vehiculo !== filtros.vehiculo) return false;
      }

      // Filtro de horario
      if (filtros.horario && filtros.horario !== 'Todos') {
        if (campana.horario !== 'Todos' && campana.horario !== filtros.horario) return false;
      }

      // Filtro de jornada
      if (filtros.jornada && filtros.jornada !== 'Todas') {
        if (campana.jornada !== 'Todas' && campana.jornada !== filtros.jornada) return false;
      }

      return true;
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('mensajero_auth');
    navigate('/mensajeros/acceso');
  };

  const handleBuscarCampanas = () => {
    const nuevosFiltros = {
      ciudad: ciudad || 'Todas',
      radioKm: radioKm[0],
      vehiculo: vehiculo || 'Todos',
      horario: horario || 'Todos',
      jornada: jornada || 'Todas'
    };

    // Update mensajero auth with new filters
    if (mensajero) {
      const updatedAuth = {
        ...mensajero,
        filtros: nuevosFiltros
      };
      localStorage.setItem('mensajero_auth', JSON.stringify(updatedAuth));
      setMensajero(updatedAuth);
    }

    // Reload campañas from localStorage to get any new campaigns
    const storedCampanas = localStorage.getItem('onus_campaigns');
    console.log('🔍 DEBUG: storedCampanas raw:', storedCampanas);
    if (storedCampanas) {
      const allCampanas: AdminCampaign[] = JSON.parse(storedCampanas);
      console.log('🔍 DEBUG: Todas las campañas:', allCampanas);
      console.log('🔍 DEBUG: Número total de campañas:', allCampanas.length);
      
      // Solo campañas activas
      const activeCampanas = allCampanas.filter(c => c.isActive).map(convertAdminCampaignToCampana);
      console.log('🔍 DEBUG: Campañas activas convertidas:', activeCampanas);
      console.log('🔍 DEBUG: Número de campañas activas:', activeCampanas.length);
      
      setCampanas(activeCampanas);
      
      // Apply new filters
      const filtered = filterCampanas(activeCampanas, nuevosFiltros);
      console.log('🔍 DEBUG: Campañas después de filtrar:', filtered);
      console.log('🔍 DEBUG: Número de campañas filtradas:', filtered.length);
      setCampanasFiltradas(filtered);
    }
    
    setShowFilters(false);
  };

  if (!mensajero) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#000935' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 mx-auto mb-4" style={{ borderColor: '#00C9CE' }}></div>
          <p className="text-white">{TEXTS.couriers.session.list.loading}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden" style={{ backgroundColor: '#000935', minHeight: 'calc(100vh - 80px)' }}>
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-no-repeat"
        style={{ 
          backgroundImage: `url(${backgroundImage})`,
          backgroundPosition: 'center',
          opacity: 0.5
        }}
      />
      <div 
        className="absolute inset-0"
        style={{ 
          backgroundColor: '#000935',
          opacity: 0.5
        }}
      />
      
      <div className="container mx-auto max-w-7xl relative z-10">
        {/* Header con nombre personalizado */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-8 border-2 border-white/20">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="mb-2" style={{ 
                color: '#FFFFFF',
                fontFamily: 'REM, sans-serif',
                fontWeight: 500
              }}>
                {TEXTS.couriers.session.header.hello} {mensajero.nombre}
              </h1>
              <p className="text-gray-300">
                {TEXTS.couriers.session.header.codeLabel} <span className="font-mono text-[#00C9CE]">{mensajero.codigo}</span>
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link to="/mensajeros/postulaciones">
                <Button
                  variant="outline"
                  className="border-white text-white hover:bg-white/10 bg-transparent"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  {TEXTS.couriers.session.actions.myApplications}
                </Button>
              </Link>
              <Button
                onClick={handleLogout}
                variant="outline"
                className="border-[#00C9CE] text-[#00C9CE] hover:bg-[#00C9CE]/10 bg-transparent"
              >
                <LogOut className="w-4 h-4 mr-2" />
                {TEXTS.couriers.session.actions.logout}
              </Button>
            </div>
          </div>
        </div>

        {/* Contenido principal - Campañas disponibles */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <h2 className="mb-1" style={{ 
                color: '#000935',
                fontFamily: 'REM, sans-serif',
                fontWeight: 500
              }}>
                {TEXTS.couriers.session.title}
              </h2>
              {mensajero.filtros && (mensajero.filtros.ciudad || mensajero.filtros.radioKm) && (
                <p className="text-sm text-gray-600">
                  {mensajero.filtros.ciudad && mensajero.filtros.ciudad !== 'Todas' && mensajero.filtros.ciudad} 
                  {mensajero.filtros.radioKm && ` • ${TEXTS.couriers.session.list.templates.radiusPrefix} ${mensajero.filtros.radioKm} ${TEXTS.couriers.session.list.templates.kmSuffix}`}
                </p>
              )}
            </div>
            
            <Button
              onClick={handleLogout}
              variant="outline"
              className="border-[#00C9CE] text-[#00C9CE] hover:bg-[#00C9CE]/10"
            >
              <LogOut className="w-4 h-4 mr-2" />
              {TEXTS.couriers.session.actions.logout}
            </Button>
          </div>

          {/* Panel colapsable - Ajusta tu búsqueda */}
          <div className="mb-6">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="w-full flex justify-between items-center p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors border border-gray-200"
            >
              <span style={{ 
                color: '#000935',
                fontFamily: 'REM, sans-serif',
                fontWeight: 500
              }}>
                {TEXTS.couriers.session.filters.title}
              </span>
              {showFilters ? (
                <ChevronUp className="w-5 h-5" style={{ color: '#00C9CE' }} />
              ) : (
                <ChevronDown className="w-5 h-5" style={{ color: '#00C9CE' }} />
              )}
            </button>

            {showFilters && (
              <div className="mt-4 p-6 bg-gray-50 rounded-xl border border-gray-200 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Ciudad */}
                  <div>
                    <Label htmlFor="filter-ciudad" className="text-gray-700 mb-2">
                      {TEXTS.couriers.session.filters.labels.city}
                    </Label>
                    <Select value={ciudad} onValueChange={setCiudad}>
                      <SelectTrigger id="filter-ciudad">
                        <SelectValue placeholder={TEXTS.couriers.session.filters.placeholders.allCities} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Todas">{TEXTS.couriers.session.filters.options.allCitiesFeminine}</SelectItem>
                        {CIUDADES.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Vehículo */}
                  <div>
                    <Label htmlFor="filter-vehiculo" className="text-gray-700 mb-2">
                      {TEXTS.couriers.session.filters.labels.vehicle}
                    </Label>
                    <Select value={vehiculo} onValueChange={setVehiculo}>
                      <SelectTrigger id="filter-vehiculo">
                        <SelectValue placeholder={TEXTS.couriers.session.filters.placeholders.allVehicles} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Todos">{TEXTS.couriers.session.filters.options.allVehicles}</SelectItem>
                        <SelectItem value="Moto">{TEXTS.couriers.session.filters.options.vehicleMoto}</SelectItem>
                        <SelectItem value="Coche">{TEXTS.couriers.session.filters.options.vehicleCar}</SelectItem>
                        <SelectItem value="Furgoneta">{TEXTS.couriers.session.filters.options.vehicleVan}</SelectItem>
                        <SelectItem value="Bicicleta">{TEXTS.couriers.session.filters.options.vehicleBike}</SelectItem>
                        <SelectItem value="A pie">{TEXTS.couriers.session.filters.options.vehicleWalking}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Horario */}
                  <div>
                    <Label htmlFor="filter-horario" className="text-gray-700 mb-2">
                      {TEXTS.couriers.session.filters.labels.schedule}
                    </Label>
                    <Select value={horario} onValueChange={setHorario}>
                      <SelectTrigger id="filter-horario">
                        <SelectValue placeholder={TEXTS.couriers.session.filters.placeholders.allSchedules} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Todos">{TEXTS.couriers.session.filters.options.allSchedules}</SelectItem>
                        <SelectItem value="Mañana">{TEXTS.couriers.session.filters.options.scheduleMorning}</SelectItem>
                        <SelectItem value="Tarde">{TEXTS.couriers.session.filters.options.scheduleAfternoon}</SelectItem>
                        <SelectItem value="Noche">{TEXTS.couriers.session.filters.options.scheduleNight}</SelectItem>
                        <SelectItem value="24h">{TEXTS.couriers.session.filters.options.scheduleFullDay}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Jornada */}
                  <div>
                    <Label htmlFor="filter-jornada" className="text-gray-700 mb-2">
                      {TEXTS.couriers.session.filters.labels.workday}
                    </Label>
                    <Select value={jornada} onValueChange={setJornada}>
                      <SelectTrigger id="filter-jornada">
                        <SelectValue placeholder={TEXTS.couriers.session.filters.placeholders.allWorkdays} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Todas">{TEXTS.couriers.session.filters.options.allWorkdays}</SelectItem>
                        <SelectItem value="Media jornada">{TEXTS.couriers.session.filters.options.workdayHalf}</SelectItem>
                        <SelectItem value="Jornada completa">{TEXTS.couriers.session.filters.options.workdayFull}</SelectItem>
                        <SelectItem value="Por horas">{TEXTS.couriers.session.filters.options.workdayHourly}</SelectItem>
                        <SelectItem value="Fines de semana">{TEXTS.couriers.session.filters.options.workdayWeekend}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Radio de búsqueda */}
                  <div>
                    <Label htmlFor="filter-radio" className="text-gray-700 mb-2">
                      {TEXTS.couriers.session.filters.labels.radius}: {radioKm[0]} km
                    </Label>
                    <Slider
                      id="filter-radio"
                      min={20}
                      max={80}
                      step={1}
                      value={radioKm}
                      onValueChange={setRadioKm}
                      className="mt-2"
                    />
                    <div className="flex justify-between mt-1">
                      <span className="text-xs text-gray-500">{TEXTS.couriers.session.filters.options.km20}</span>
                      <span className="text-xs text-gray-500">{TEXTS.couriers.session.filters.options.km80}</span>
                    </div>
                  </div>
                </div>

                {/* Botón buscar */}
                <div className="pt-2">
                  <Button
                    onClick={handleBuscarCampanas}
                    className="w-full md:w-auto hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: '#00C9CE', color: '#000935' }}
                  >
                    <Search className="w-4 h-4 mr-2" />
                    {TEXTS.couriers.session.actions.searchCampaigns}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Badges de filtros activos */}
          {mensajero.filtros && (
            <div className="flex flex-wrap gap-2 mb-6">
              {mensajero.filtros.ciudad && mensajero.filtros.ciudad !== 'Todas' && (
                <Badge variant="outline" className="bg-[#00C9CE]/10 text-[#000935] border-[#00C9CE]">
                  <MapPin className="w-3 h-3 mr-1" />
                  {mensajero.filtros.ciudad}
                </Badge>
              )}
              {mensajero.filtros.vehiculo && mensajero.filtros.vehiculo !== 'Todos' && (
                <Badge variant="outline" className="bg-[#00C9CE]/10 text-[#000935] border-[#00C9CE]">
                  <Truck className="w-3 h-3 mr-1" />
                  {mensajero.filtros.vehiculo}
                </Badge>
              )}
              {mensajero.filtros.horario && mensajero.filtros.horario !== 'Todos' && (
                <Badge variant="outline" className="bg-[#00C9CE]/10 text-[#000935] border-[#00C9CE]">
                  <Clock className="w-3 h-3 mr-1" />
                  {mensajero.filtros.horario}
                </Badge>
              )}
              {mensajero.filtros.jornada && mensajero.filtros.jornada !== 'Todas' && (
                <Badge variant="outline" className="bg-[#00C9CE]/10 text-[#000935] border-[#00C9CE]">
                  <Calendar className="w-3 h-3 mr-1" />
                  {mensajero.filtros.jornada}
                </Badge>
              )}
            </div>
          )}
          
          {/* Grid de campañas */}
          {campanasFiltradas.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 rounded-xl">
              <Info className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600 text-lg mb-2">
                {TEXTS.couriers.session.list.emptyTitle}
              </p>
              <p className="text-gray-500">
                {TEXTS.couriers.session.list.emptySubtitle}
              </p>
              {campanas.length > 0 && (
                <p className="text-gray-500 mt-2">
                  {TEXTS.couriers.session.list.templates.campaignsPrefix} {campanas.length} {campanas.length !== 1 ? TEXTS.couriers.session.list.templates.campaignPlural : TEXTS.couriers.session.list.templates.campaignSingular} {campanas.length !== 1 ? TEXTS.couriers.session.list.templates.availablePlural : TEXTS.couriers.session.list.templates.availableSingular} {TEXTS.couriers.session.list.availableOtherZones}
                </p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {campanasFiltradas.map((campana) => (
                <CampanaCard
                  key={campana.id}
                  campana={campana}
                  isPostulado={postulaciones.includes(campana.id)}
                  onVer={() => {
                    setSelectedCampaign(campana);
                    setShowDetailsModal(true);
                  }}
                  onMeInteresa={() => {
                    setSelectedCampaign(campana);
                    setShowFormModal(true);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Detalles */}
      {showDetailsModal && selectedCampaign && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => setShowDetailsModal(false)}
        >
          <div 
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 sm:p-8">
              {/* Header del modal */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="mb-2" style={{ 
                    color: '#000935',
                    fontFamily: 'REM, sans-serif',
                    fontWeight: 500
                  }}>
                    {selectedCampaign.nombre}
                  </h2>
                  <Badge className="bg-[#00C9CE] text-white border-0">
                    {TEXTS.couriers.session.modals.details.badgeActive}
                  </Badge>
                </div>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  style={{ color: '#000935' }}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Contenido del modal */}
              <div className="space-y-6">
                {/* Descripción */}
                <div>
                  <h3 className="text-sm uppercase tracking-wide mb-2" style={{ color: '#00C9CE' }}>
                    {TEXTS.couriers.session.modals.details.sectionDescription}
                  </h3>
                  <p className="text-gray-700">
                    {selectedCampaign.descripcion}
                  </p>
                </div>

                {/* Información de ubicación y compensación */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center mb-2">
                      <MapPin className="w-5 h-5 mr-2" style={{ color: '#00C9CE' }} />
                      <span className="text-sm text-gray-600">{TEXTS.couriers.session.modals.details.labelLocation}</span>
                    </div>
                    <p className="font-medium" style={{ color: '#000935' }}>
                      {selectedCampaign.ciudad}
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center mb-2">
                      <DollarSign className="w-5 h-5 mr-2" style={{ color: '#00C9CE' }} />
                      <span className="text-sm text-gray-600">{TEXTS.couriers.session.modals.details.labelCompensation}</span>
                    </div>
                    <p className="font-medium" style={{ color: '#00C9CE' }}>
                      {selectedCampaign.pago}
                    </p>
                  </div>
                </div>

                {/* Requisitos */}
                <div>
                  <h3 className="text-sm uppercase tracking-wide mb-3" style={{ color: '#00C9CE' }}>
                    {TEXTS.couriers.session.modals.details.sectionRequirements}
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                      <Truck className="w-4 h-4 mr-3 shrink-0" style={{ color: '#00C9CE' }} />
                      <span className="text-sm text-gray-700">{TEXTS.couriers.session.modals.details.requirements.vehicle} {selectedCampaign.vehiculo}</span>
                    </div>
                    <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                      <Clock className="w-4 h-4 mr-3 shrink-0" style={{ color: '#00C9CE' }} />
                      <span className="text-sm text-gray-700">{TEXTS.couriers.session.modals.details.requirements.schedule} {selectedCampaign.horario}</span>
                    </div>
                    <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                      <Calendar className="w-4 h-4 mr-3 shrink-0" style={{ color: '#00C9CE' }} />
                      <span className="text-sm text-gray-700">{TEXTS.couriers.session.modals.details.requirements.workday} {selectedCampaign.jornada}</span>
                    </div>
                  </div>
                </div>

                {/* Fecha de creación */}
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    {TEXTS.couriers.session.modals.details.createdOn} {new Date(selectedCampaign.fechaInicio).toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                </div>

                {/* Botones */}
                <div className="flex gap-3">
                  <Button
                    onClick={() => {
                      // Abrir WhatsApp
                      const mensaje = `Hola! Me interesa la campaña: ${selectedCampaign.nombre}. Mi nombre es ${mensajero?.nombre} (Código: ${mensajero?.codigo}). ${TEXTS.couriers.session.modals.details.whatsappMessageEnd}`;
                      window.open(`https://wa.me/34676728527?text=${encodeURIComponent(mensaje)}`, '_blank');
                    }}
                    className="flex-1 hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: '#00C9CE', color: '#000935' }}
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    {TEXTS.couriers.session.modals.details.whatsappButton}
                  </Button>
                  <Button
                    onClick={() => setShowDetailsModal(false)}
                    variant="outline"
                    className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    {TEXTS.couriers.session.modals.details.buttonClose}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Formulario "Me Interesa" */}
      {showFormModal && selectedCampaign && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => setShowFormModal(false)}
        >
          <div 
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 sm:p-8">
              {/* Header del modal */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="mb-2" style={{ 
                    color: '#000935',
                    fontFamily: 'REM, sans-serif',
                    fontWeight: 500
                  }}>
                    {TEXTS.couriers.session.modals.application.title} {selectedCampaign.nombre}
                  </h2>
                  <p className="text-sm text-gray-600">
                    {TEXTS.couriers.session.modals.application.subtitle}
                  </p>
                </div>
                <button
                  onClick={() => setShowFormModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  style={{ color: '#000935' }}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Formulario */}
              <form onSubmit={(e) => {
                e.preventDefault();
                
                // Guardar solicitud en leads
                const storedLeads = localStorage.getItem('onus_leads');
                const leads = storedLeads ? JSON.parse(storedLeads) : [];
                
                const newLead = {
                  id: crypto.randomUUID(),
                  tipo: 'Campaña',
                  servicio: selectedCampaign.nombre,
                  nombre: mensajero?.nombre || '',
                  email: mensajero?.email || '',
                  telefono: mensajero?.telefono || '',
                  mensaje: `${formData.motivacion}\n\nExperiencia: ${formData.experiencia}\n\nDisponibilidad: ${formData.disponibilidad}`,
                  fecha: new Date().toISOString(),
                  estado: 'Pendiente',
                  origen: 'Portal Mensajeros',
                  campanaId: selectedCampaign.id
                };
                
                leads.push(newLead);
                localStorage.setItem('onus_leads', JSON.stringify(leads));
                
                // Crear postulación
                const storedPostulaciones = localStorage.getItem('onus_postulaciones');
                const allPostulaciones = storedPostulaciones ? JSON.parse(storedPostulaciones) : [];
                
                const newPostulacion = {
                  id: crypto.randomUUID(),
                  mensajeroCodigo: mensajero?.codigo || '',
                  mensajeroNombre: mensajero?.nombre || '',
                  mensajeroEmail: mensajero?.email || '',
                  mensajeroTelefono: mensajero?.telefono || '',
                  campanaId: selectedCampaign.id,
                  campanaNombre: selectedCampaign.nombre,
                  fecha: new Date().toISOString(),
                  estado: 'En revisión',
                  motivacion: formData.motivacion,
                  experiencia: formData.experiencia,
                  disponibilidad: formData.disponibilidad
                };
                
                allPostulaciones.push(newPostulacion);
                localStorage.setItem('onus_postulaciones', JSON.stringify(allPostulaciones));
                
                // Actualizar estado local para marcar como postulado
                setPostulaciones([...postulaciones, selectedCampaign.id]);
                
                toast.success(TEXTS.couriers.session.feedback.interestRegistered);
                setShowFormModal(false);
                setFormData({ motivacion: '', experiencia: '', disponibilidad: '' });
              }} className="space-y-4">
                {/* Motivación */}
                <div>
                  <Label htmlFor="motivacion" className="text-gray-700">
                    {TEXTS.couriers.session.modals.application.labels.motivation}
                  </Label>
                  <Textarea
                    id="motivacion"
                    value={formData.motivacion}
                    onChange={(e) => setFormData({ ...formData, motivacion: e.target.value })}
                    required
                    rows={4}
                    placeholder={TEXTS.couriers.session.modals.application.placeholders.motivation}
                    className="mt-1"
                  />
                </div>

                {/* Experiencia */}
                <div>
                  <Label htmlFor="experiencia" className="text-gray-700">
                    {TEXTS.couriers.session.modals.application.labels.experience}
                  </Label>
                  <Textarea
                    id="experiencia"
                    value={formData.experiencia}
                    onChange={(e) => setFormData({ ...formData, experiencia: e.target.value })}
                    required
                    rows={3}
                    placeholder={TEXTS.couriers.session.modals.application.placeholders.experience}
                    className="mt-1"
                  />
                </div>

                {/* Disponibilidad */}
                <div>
                  <Label htmlFor="disponibilidad" className="text-gray-700">
                    {TEXTS.couriers.session.modals.application.labels.availability}
                  </Label>
                  <Input
                    id="disponibilidad"
                    value={formData.disponibilidad}
                    onChange={(e) => setFormData({ ...formData, disponibilidad: e.target.value })}
                    required
                    placeholder={TEXTS.couriers.session.modals.application.placeholders.availability}
                    className="mt-1"
                  />
                </div>

                {/* Resumen de tu perfil */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <h4 className="text-sm mb-3" style={{ color: '#000935', fontFamily: 'REM, sans-serif', fontWeight: 500 }}>
                    {TEXTS.couriers.session.modals.application.profileSection.title}
                  </h4>
                  <div className="space-y-1 text-sm">
                    <p className="text-gray-700"><strong>{TEXTS.couriers.session.modals.application.profileSection.name}</strong> {mensajero?.nombre}</p>
                    <p className="text-gray-700"><strong>{TEXTS.couriers.session.modals.application.profileSection.email}</strong> {mensajero?.email}</p>
                    <p className="text-gray-700"><strong>{TEXTS.couriers.session.modals.application.profileSection.phone}</strong> {mensajero?.telefono}</p>
                    <p className="text-gray-700"><strong>{TEXTS.couriers.session.modals.application.profileSection.code}</strong> {mensajero?.codigo}</p>
                  </div>
                </div>

                {/* Botones */}
                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    onClick={() => setShowFormModal(false)}
                    variant="outline"
                    className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    {TEXTS.couriers.session.modals.application.buttons.cancel}
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: '#00C9CE', color: '#000935' }}
                  >
                    {TEXTS.couriers.session.actions.sendApplication}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}