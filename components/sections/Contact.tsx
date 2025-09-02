"use client"
import { MapPin, Clock, Phone, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"

export function Contact() {
  return (
    <section id="contact" className="py-20 px-4 bg-[#FFF5E6]">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="font-cursive text-4xl md:text-5xl text-[#C48A6A] mb-4">Contáctanos</h2>
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
                <span className="text-gray-600"> Calle 9na, #112 Campesina, Ciudad Jimenez, CP 33985</span>
              </div>
              <div className="flex items-center space-x-3">
                <Clock className="h-5 w-5 text-[#C48A6A]" />
                <span className="text-gray-600">Lun-Vie: 9AM-5PM, Sab: 9AM-12PM</span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-[#C48A6A]" />
                <span className="text-gray-600">(614) 486-87-71</span>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-[#C48A6A]" />
                <span className="text-gray-600">rolles.caseros@funnyrolls.com</span>
              </div>
            </div>
          </div>

          <form className="animate-fade-in-up space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">Nombre</label>
              <input
                type="text"
                id="name"
                className="w-full px-4 py-3 border border-[#C48A6A]/30 rounded-lg focus:ring-2 focus:ring-[#C48A6A] focus:border-transparent transition-all"
                placeholder="Tu nombre"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Correo</label>
              <input
                type="email"
                id="email"
                className="w-full px-4 py-3 border border-[#C48A6A]/30 rounded-lg focus:ring-2 focus:ring-[#C48A6A] focus:border-transparent transition-all"
                placeholder="tu@correo.com"
              />
            </div>
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">Mensaje</label>
              <textarea
                id="message"
                rows={4}
                className="w-full px-4 py-3 border border-[#C48A6A]/30 rounded-lg focus:ring-2 focus:ring-[#C48A6A] focus:border-transparent transition-all"
                placeholder="Cuéntanos sobre tu pedido personalizado o solo saluda"
              />
            </div>
            <Button type="submit" className="w-full bg-[#C48A6A] hover:bg-[#8B4513] text-white py-3">Enviar Mensaje</Button>
          </form>
        </div>
      </div>
    </section>
  )
}
