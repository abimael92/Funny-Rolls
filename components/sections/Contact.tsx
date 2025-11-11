"use client"
import { MapPin, Clock, Phone } from "lucide-react" //Mail
import { Button } from "@/components/ui/button"
import { FormEvent } from "react"

export function Contact() {

  const handleWhatsAppSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const form = e.currentTarget;
    const formData = new FormData(form);
    const name = formData.get('name');
    const phone = formData.get('phone');
    const message = formData.get('message');

    // Your WhatsApp number (include country code, remove any spaces or special characters)
    const phoneNumber = "5216144868771"; // Using your actual phone number from the contact info

    // Create a better formatted message
    const whatsappMessage = `🍩 *NUEVO MENSAJE DE FUNNY ROLLS* 🍩

*Nombre:* ${name}
*Teléfono:* ${phone}

*Mensaje:*
${message}

_Enviado desde Funny Rolls Website_`;

    // Encode the message for URL
    const encodedMessage = encodeURIComponent(whatsappMessage);

    // Create WhatsApp URL
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;

    // Open WhatsApp in new tab
    window.open(whatsappUrl, '_blank');
  };

  return (
    <section id="contact" className="py-20 px-4 bg-[#FFF5E6] scroll-mt-24">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="font-cursive text-4xl md:text-5xl text-[#8B4513] mb-4">Contáctanos</h2>
          <p className="text-lg text-gray-600 text-pretty">
            ¿Tienes un pedido personalizado o solo quieres saludar? ¡Nos encantaría saber de ti!
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="animate-fade-in-up">
            <h3 className="font-cursive text-2xl text-[#C48A6A] mb-6">Visitanos</h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <MapPin className="h-5 w-5 text-[#C48A6A]" />
                <span className="text-gray-600">
                  Calle 9na #111, Col Campesina, CP 33985
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <Clock className="h-5 w-5 text-[#C48A6A]" />
                <span className="text-gray-600">Jueves a Domingo: 12PM-8PM</span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-[#C48A6A]" />
                <span className="text-gray-600">(614) 486-87-71</span>
              </div>
              {/* <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-[#C48A6A]" />
                <span className="text-gray-600">rolles.caseros@funnyrolls.com</span>
              </div> */}
            </div>
          </div>

          <form className="animate-fade-in-up space-y-6" onSubmit={handleWhatsAppSubmit}>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">Nombre</label>
              <input
                type="text"
                id="name"
                name="name"
                className="w-full px-4 py-3 border border-[#C48A6A]/30 bg-amber-100 rounded-lg focus:ring-2 focus:ring-[#C48A6A] focus:border-transparent transition-all"
                placeholder="Tu nombre"
                required
              />
            </div>
            {/* <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Correo</label>
              <input
                type="email"
                id="email"
                name="email"
                className="w-full px-4 py-3 border border-[#C48A6A]/30 rounded-lg focus:ring-2 focus:ring-[#C48A6A] focus:border-transparent transition-all"
                placeholder="tu@correo.com"
                required
              />
            </div>*/}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">Teléfono</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                className="w-full px-4 py-3 border border-[#C48A6A]/30 bg-amber-100 rounded-lg focus:ring-2 focus:ring-[#C48A6A] focus:border-transparent transition-all"
                placeholder="+52 123 456 7890"
                required
              />
            </div>
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">Mensaje</label>
              <textarea
                id="message"
                name="message"
                rows={4}
                className="w-full px-4 py-3 border border-[#C48A6A]/30 bg-amber-100 rounded-lg focus:ring-2 focus:ring-[#C48A6A] focus:border-transparent transition-all"
                placeholder="Cuéntanos sobre tu pedido personalizado o solo saluda"
                required
              />
            </div>

            <div className="flex justify-center items-center">


              <Button
                className="w-36 h-10 flex items-center justify-center gap-3 text-md font-medium bg-emerald-600 hover:bg-emerald-300 hover:text-black text-white rounded-md"
              >
                <svg
                  className="h-64 w-64"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347M12.05 23.785h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884z" />
                </svg>
                WhatsApp
              </Button>
            </div>

          </form>
        </div>
      </div>
    </section>
  )
}
