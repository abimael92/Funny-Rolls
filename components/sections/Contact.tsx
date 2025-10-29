"use client"
import { MapPin, Clock, Phone, } from "lucide-react" //Mail
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
    <section id="contact" className="py-20 px-4 bg-[#FFF5E6]">
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
                className="w-full px-4 py-3 border border-[#C48A6A]/30 rounded-lg focus:ring-2 focus:ring-[#C48A6A] focus:border-transparent transition-all"
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
                className="w-full px-4 py-3 border border-[#C48A6A]/30 rounded-lg focus:ring-2 focus:ring-[#C48A6A] focus:border-transparent transition-all"
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
                className="w-full px-4 py-3 border border-[#C48A6A]/30 rounded-lg focus:ring-2 focus:ring-[#C48A6A] focus:border-transparent transition-all"
                placeholder="Cuéntanos sobre tu pedido personalizado o solo saluda"
                required
              />
            </div>
            <Button type="submit" className="w-full bg-[#8B4513] hover:bg-[#C48A6A] text-white py-3">
              Enviar a WhatsApp
            </Button>
          </form>
        </div>
      </div>
    </section>
  )
}
