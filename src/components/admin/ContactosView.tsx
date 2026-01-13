import { Mail, Phone, Building, User, CheckCircle2 } from 'lucide-react';
import { Button } from '../ui/button';
import { TEXTS } from '@/content/texts';

interface Contacto {
  id: string;
  nombre: string;
  empresa?: string;
  telefono: string;
  email: string;
  mensaje: string;
  fecha: string;
  leido: boolean;
}

interface ContactosViewProps {
  contactos: Contacto[];
  loadingContactos: boolean;
  onMarcarLeido: (id: string) => void;
  onActualizar: () => void;
}

export function ContactosView({ contactos, loadingContactos, onMarcarLeido, onActualizar }: ContactosViewProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-black flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-[#00C9CE]/20 rounded-full flex items-center justify-center">
              <Mail className="w-5 h-5 text-[#00C9CE]" />
            </div>
            {TEXTS.admin.contactos.title}
          </h1>
          <p className="text-gray-600">
            {TEXTS.admin.contactos.summary.totalPrefix} {contactos.length} {TEXTS.admin.contactos.summary.messagesLabel} • {TEXTS.admin.contactos.summary.unreadPrefix} {contactos.filter(c => !c.leido).length}
          </p>
        </div>
        <Button onClick={onActualizar} variant="outline" disabled={loadingContactos}>
          {loadingContactos ? TEXTS.admin.contactos.actions.loading : TEXTS.admin.contactos.actions.refresh}
        </Button>
      </div>

      {loadingContactos ? (
        <div className="bg-white rounded-xl p-12 text-center">
          <p className="text-gray-500">{TEXTS.admin.contactos.states.loadingTitle}</p>
        </div>
      ) : contactos.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center">
          <Mail className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-black text-xl mb-2">{TEXTS.admin.contactos.states.emptyTitle}</h3>
          <p className="text-gray-500">{TEXTS.admin.contactos.states.emptySubtitle}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {contactos.map((contacto) => (
            <div key={contacto.id} className={`bg-white rounded-xl p-6 shadow-sm border-2 transition-all ${
              !contacto.leido ? 'border-[#00C9CE]' : 'border-gray-200'
            }`}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-[#00C9CE]/10 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-[#00C9CE]" />
                  </div>
                  <div>
                    <h3 className="text-lg" style={{ color: '#000935', fontFamily: 'REM, sans-serif', fontWeight: 500 }}>
                      {contacto.nombre}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {new Date(contacto.fecha).toLocaleDateString('es-ES', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
                {!contacto.leido && (
                  <Button
                    onClick={() => onMarcarLeido(contacto.id)}
                    size="sm"
                    className="bg-[#00C9CE] hover:bg-[#00B5BA] text-[#000935]"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    {TEXTS.admin.contactos.actions.markRead}
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-700">{contacto.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-700">{contacto.telefono}</span>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500 mb-1">{TEXTS.admin.contactos.message.label}</p>
                <p className="text-gray-700">{contacto.mensaje}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}