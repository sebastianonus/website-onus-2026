import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Loader2, UserCircle, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Slider } from './ui/slider';
import backgroundImage from 'figma:asset/4261f3db5c66ef3456a8ebcae9838917a1e10ea5.png';
import logo from 'figma:asset/e80d7ef4ac3b9441721d6916cfc8ad34baf40db1.png';
import { TEXTS } from '@/content/texts';

const STORAGE_KEY = 'onus_mensajeros';
const LEADS_STORAGE_KEY = 'onus_leads';

interface MensajeroData {
  codigo: string;
  nombre: string;
  email: string;
  telefono: string;
  fechaRegistro: string;
  activo: boolean;
}

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

export function MensajerosLogin() {
  const navigate = useNavigate();
  const [codigo, setCodigo] = useState('');
  const [ciudad, setCiudad] = useState('');
  const [radioKm, setRadioKm] = useState([50]);
  const [vehiculo, setVehiculo] = useState('');
  const [horario, setHorario] = useState('');
  const [jornada, setJornada] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Modal state for registration
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    ciudad: '',
    experiencia: ''
  });
  const [formLoading, setFormLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Get demo code from environment variable, fallback to default for development
      const DEMO_CODE = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_DEMO_MESSENGER_CODE) || '123456';
      
      // Check if it's the demo code first
      if (codigo === DEMO_CODE) {
        // Store demo auth in localStorage with filters
        localStorage.setItem('mensajero_auth', JSON.stringify({
          codigo: DEMO_CODE,
          nombre: 'Demo Mensajero',
          email: 'demo@onusexpress.com',
          telefono: '600000000',
          activo: true,
          fechaLogin: new Date().toISOString(),
          filtros: {
            ciudad: ciudad || 'Todas',
            radioKm: radioKm[0],
            vehiculo: vehiculo || 'Todos',
            horario: horario || 'Todos',
            jornada: jornada || 'Todas'
          }
        }));

        setLoading(false);
        navigate('/mensajeros');
        return;
      }

      // If not demo code, verify against localStorage mensajeros
      const storedMensajeros = localStorage.getItem(STORAGE_KEY);
      if (!storedMensajeros) {
        setError(TEXTS.couriers.login.feedback.errors.invalidOrInactiveCode);
        setLoading(false);
        return;
      }

      const mensajeros: MensajeroData[] = JSON.parse(storedMensajeros);
      const mensajero = mensajeros.find(m => m.codigo === codigo);

      if (!mensajero) {
        setError(TEXTS.couriers.login.feedback.errors.invalidOrInactiveCode);
        setLoading(false);
        return;
      }

      if (!mensajero.activo) {
        setError(TEXTS.couriers.login.feedback.errors.invalidOrInactiveCode);
        setLoading(false);
        return;
      }

      // Store authenticated mensajero data with filters
      localStorage.setItem('mensajero_auth', JSON.stringify({
        codigo: mensajero.codigo,
        nombre: mensajero.nombre,
        email: mensajero.email,
        telefono: mensajero.telefono,
        activo: true,
        fechaLogin: new Date().toISOString(),
        filtros: {
          ciudad: ciudad || 'Todas',
          radioKm: radioKm[0],
          vehiculo: vehiculo || 'Todos',
          horario: horario || 'Todos',
          jornada: jornada || 'Todas'
        }
      }));

      setLoading(false);
      navigate('/mensajeros');

    } catch (error) {
      console.error('Error en login:', error);
      setError(TEXTS.couriers.login.feedback.errors.verifyCodeError);
      setLoading(false);
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      // Store lead data in localStorage
      const storedLeads = localStorage.getItem(LEADS_STORAGE_KEY);
      const leads = storedLeads ? JSON.parse(storedLeads) : [];
      
      const newLead = {
        id: `lead_${Date.now()}`,
        nombre: formData.nombre,
        empresa: '', // Not required for messenger
        email: formData.email,
        telefono: formData.telefono,
        ciudad: formData.ciudad || '',
        experiencia: formData.experiencia || '',
        mensaje: `Ciudad: ${formData.ciudad}, Experiencia: ${formData.experiencia}`,
        lead_type: 'messenger',
        service: 'fleet',
        source: 'messenger_access',
        status: 'new',
        internal_notes: '',
        tags: ['Solicitud Código'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      leads.push(newLead);
      localStorage.setItem(LEADS_STORAGE_KEY, JSON.stringify(leads));

      // Reset form
      setFormData({
        nombre: '',
        email: '',
        telefono: '',
        ciudad: '',
        experiencia: ''
      });

      setFormLoading(false);
      setShowModal(false);
      toast.success(TEXTS.couriers.login.feedback.toasts.requestSuccess);

    } catch (error) {
      console.error('Error en form submission:', error);
      setFormLoading(false);
      toast.error(TEXTS.couriers.login.feedback.toasts.requestError);
    }
  };

  return (
    <div className="flex items-center justify-center px-6 pt-28 pb-16 relative overflow-hidden" style={{ backgroundColor: '#000935', minHeight: 'calc(100vh - 80px)' }}>
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-no-repeat"
        style={{ 
          backgroundImage: `url(${backgroundImage})`,
          backgroundPosition: 'center top',
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

      <div className="w-full max-w-md relative z-10">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <img src={logo} alt="ONUS EXPRESS" className="h-12" />
          </div>

          <h1 className="text-center mb-2" style={{ 
            color: '#000935',
            fontFamily: 'REM, sans-serif',
            fontWeight: 500
          }}>
            {TEXTS.couriers.login.title}
          </h1>
          <p className="text-center text-gray-600 mb-8">
            {TEXTS.couriers.login.subtitle}
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Código de acceso */}
            <div>
              <Label htmlFor="codigo" className="text-gray-700">
                {TEXTS.couriers.login.form.labels.accessCode}
              </Label>
              <Input
                id="codigo"
                type="text"
                placeholder={TEXTS.couriers.login.form.placeholders.accessCode}
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                className="mt-1"
                required
              />
            </div>

            {/* Ciudad */}
            <div>
              <Label htmlFor="ciudad" className="text-gray-700">
                {TEXTS.couriers.login.form.labels.city}
              </Label>
              <Select value={ciudad} onValueChange={setCiudad}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder={TEXTS.couriers.login.form.placeholders.city} />
                </SelectTrigger>
                <SelectContent>
                  {CIUDADES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Radio de búsqueda */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <Label htmlFor="radio" className="text-gray-700">
                  {TEXTS.couriers.login.form.labels.radius}: {radioKm[0]} km
                </Label>
              </div>
              <Slider
                id="radio"
                min={20}
                max={80}
                step={1}
                value={radioKm}
                onValueChange={setRadioKm}
                className="mt-2"
              />
              <div className="flex justify-between mt-1">
                <span className="text-xs text-gray-500">20 km</span>
                <span className="text-xs text-gray-500">80 km</span>
              </div>
            </div>

            {/* Vehículo */}
            <div>
              <Label htmlFor="vehiculo" className="text-gray-700">
                {TEXTS.couriers.login.form.labels.vehicle}
              </Label>
              <Select value={vehiculo} onValueChange={setVehiculo}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder={TEXTS.couriers.login.form.placeholders.allMasculine} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todos">Todos</SelectItem>
                  <SelectItem value="Moto">Moto</SelectItem>
                  <SelectItem value="Coche">Coche</SelectItem>
                  <SelectItem value="Furgoneta">Furgoneta</SelectItem>
                  <SelectItem value="Bicicleta">Bicicleta</SelectItem>
                  <SelectItem value="A pie">A pie</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Horario */}
            <div>
              <Label htmlFor="horario" className="text-gray-700">
                {TEXTS.couriers.login.form.labels.schedule}
              </Label>
              <Select value={horario} onValueChange={setHorario}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder={TEXTS.couriers.login.form.placeholders.allMasculine} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todos">Todos</SelectItem>
                  <SelectItem value="Mañana">Mañana (8:00 - 14:00)</SelectItem>
                  <SelectItem value="Tarde">Tarde (14:00 - 20:00)</SelectItem>
                  <SelectItem value="Noche">Noche (20:00 - 2:00)</SelectItem>
                  <SelectItem value="24h">24 horas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Jornada */}
            <div>
              <Label htmlFor="jornada" className="text-gray-700">
                {TEXTS.couriers.login.form.labels.workday}
              </Label>
              <Select value={jornada} onValueChange={setJornada}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder={TEXTS.couriers.login.form.placeholders.allFeminine} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todas">Todas</SelectItem>
                  <SelectItem value="Media jornada">Media jornada</SelectItem>
                  <SelectItem value="Jornada completa">Jornada completa</SelectItem>
                  <SelectItem value="Por horas">Por horas</SelectItem>
                  <SelectItem value="Fines de semana">Fines de semana</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Error message */}
            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Submit button */}
            <Button
              type="submit"
              className="w-full py-6 hover:opacity-90 transition-opacity"
              style={{ backgroundColor: '#00C9CE', color: '#000935' }}
              disabled={loading}
            >
              {loading ? <Loader2 className="animate-spin" /> : TEXTS.couriers.login.form.buttons.access}
            </Button>

            {/* Register link */}
            <div className="text-center pt-4">
              <p className="text-sm text-gray-600">
                {TEXTS.couriers.login.register.noCode}{' '}
                <button
                  type="button"
                  onClick={() => setShowModal(true)}
                  className="hover:underline"
                  style={{ color: '#00C9CE' }}
                >
                  {TEXTS.couriers.login.register.linkText}
                </button>
              </p>
            </div>
          </form>
        </div>
      </div>

      {/* Modal de registro */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6 overflow-y-auto py-8" style={{ backgroundColor: '#000935' }}>
          {/* Background Image with Overlay */}
          <div 
            className="absolute inset-0 bg-cover bg-no-repeat"
            style={{ 
              backgroundImage: `url(${backgroundImage})`,
              backgroundPosition: 'center top',
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

          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md relative z-10">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl" style={{ 
                color: '#000935',
                fontFamily: 'REM, sans-serif',
                fontWeight: 500
              }}>
                {TEXTS.couriers.login.ctaTitle}
              </h2>
              <button
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setShowModal(false)}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-center text-gray-600 mb-6">
              {TEXTS.couriers.login.register.subtitle}
            </p>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              {/* Nombre */}
              <div>
                <Label htmlFor="nombre" className="text-gray-700">
                  {TEXTS.couriers.login.modal.labels.fullName}
                </Label>
                <Input
                  id="nombre"
                  name="nombre"
                  type="text"
                  placeholder={TEXTS.couriers.login.modal.placeholders.fullName}
                  value={formData.nombre}
                  onChange={handleFormChange}
                  className="mt-1"
                  required
                />
              </div>

              {/* Email */}
              <div>
                <Label htmlFor="email" className="text-gray-700">
                  {TEXTS.couriers.login.modal.labels.email}
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder={TEXTS.couriers.login.modal.placeholders.email}
                  value={formData.email}
                  onChange={handleFormChange}
                  className="mt-1"
                  required
                />
              </div>

              {/* Teléfono */}
              <div>
                <Label htmlFor="telefono" className="text-gray-700">
                  {TEXTS.couriers.login.modal.labels.phone}
                </Label>
                <Input
                  id="telefono"
                  name="telefono"
                  type="tel"
                  placeholder={TEXTS.couriers.login.modal.placeholders.phone}
                  value={formData.telefono}
                  onChange={handleFormChange}
                  className="mt-1"
                  required
                />
              </div>

              {/* Ciudad */}
              <div>
                <Label htmlFor="ciudad" className="text-gray-700">
                  {TEXTS.couriers.login.modal.labels.city}
                </Label>
                <Input
                  id="ciudad"
                  name="ciudad"
                  type="text"
                  placeholder={TEXTS.couriers.login.modal.placeholders.city}
                  value={formData.ciudad}
                  onChange={handleFormChange}
                  className="mt-1"
                  required
                />
              </div>

              {/* Experiencia */}
              <div>
                <Label htmlFor="experiencia" className="text-gray-700">
                  {TEXTS.couriers.login.modal.labels.experience}
                </Label>
                <Input
                  id="experiencia"
                  name="experiencia"
                  type="text"
                  placeholder={TEXTS.couriers.login.modal.placeholders.experience}
                  value={formData.experiencia}
                  onChange={handleFormChange}
                  className="mt-1"
                  required
                />
              </div>

              {/* Submit button */}
              <Button
                type="submit"
                className="w-full py-6 hover:opacity-90 transition-opacity mt-6"
                style={{ backgroundColor: '#00C9CE', color: '#000935' }}
                disabled={formLoading}
              >
                {formLoading ? (
                  <>
                    <Loader2 className="animate-spin mr-2" />
                    {TEXTS.couriers.login.modal.buttons.submitting}
                  </>
                ) : (
                  TEXTS.couriers.login.modal.buttons.submit
                )}
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}