"use client"
import { MapPin, Clock, Phone, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"

export function Contact() {
  return (
    <section id="contact" className="py-20 px-4 bg-[#FFF5E6]">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="font-cursive text-4xl md:text-5xl text-[#C48A6A] mb-4">Get in Touch</h2>
          <p className="text-lg text-gray-600 text-pretty">
            Have a custom order or just want to say hello? We&apos;d love to hear from you!
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="animate-fade-in-up">
            <h3 className="font-cursive text-2xl text-[#C48A6A] mb-6">Visit Our Bakery</h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <MapPin className="h-5 w-5 text-[#C48A6A]" />
                <span className="text-gray-600">123 Sweet Street, Bakery Town, BT 12345</span>
              </div>
              <div className="flex items-center space-x-3">
                <Clock className="h-5 w-5 text-[#C48A6A]" />
                <span className="text-gray-600">Mon-Sat: 7AM-7PM, Sun: 8AM-5PM</span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-[#C48A6A]" />
                <span className="text-gray-600">(555) 123-ROLL</span>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-[#C48A6A]" />
                <span className="text-gray-600">hello@funnyrolls.com</span>
              </div>
            </div>
          </div>

          <form className="animate-fade-in-up space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">Name</label>
              <input
                type="text"
                id="name"
                className="w-full px-4 py-3 border border-[#C48A6A]/30 rounded-lg focus:ring-2 focus:ring-[#C48A6A] focus:border-transparent transition-all"
                placeholder="Your name"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                id="email"
                className="w-full px-4 py-3 border border-[#C48A6A]/30 rounded-lg focus:ring-2 focus:ring-[#C48A6A] focus:border-transparent transition-all"
                placeholder="your@email.com"
              />
            </div>
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">Message</label>
              <textarea
                id="message"
                rows={4}
                className="w-full px-4 py-3 border border-[#C48A6A]/30 rounded-lg focus:ring-2 focus:ring-[#C48A6A] focus:border-transparent transition-all"
                placeholder="Tell us about your custom order or just say hi!"
              />
            </div>
            <Button type="submit" className="w-full bg-[#C48A6A] hover:bg-[#8B4513] text-white py-3">Send Message</Button>
          </form>
        </div>
      </div>
    </section>
  )
}
