"use client"
import { useEffect, useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"

export function Hero() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src="/img/beautiful-cinnamon-rolls.jpg"
          alt="Rollos de canela deliciosos"
          width={1200}
          height={800}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40"></div>
      </div>

      {/* Content */}
      <div className={`relative z-10 text-center text-white px-4 ${isVisible ? "animate-fade-in-up" : "opacity-0"}`}>
        <h1 className="font-cursive text-4xl text-amber-200 md:text-6xl lg:text-7xl mb-6 text-balance [text-shadow:_2px_2px_4px_rgb(0_0_0_/_80%)]">
          ¡Ríe y Disfruta Cada Remolino!
        </h1>
        <p className="text-xl md:text-2xl mt-8 mb-8 max-w-2xl mx-auto text-pretty">
          Rollos de canela deliciosamente divertidos que te harán sonreír y querer más
        </p>
        <Button
          size="lg"
          className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-orange-600 hover:via-amber-600 hover:to-orange-700 text-white px-8 py-4 text-lg font-semibold rounded-full transform hover:scale-105 transition-all duration-300 shadow-lg"
          onClick={() => document.getElementById("menu")?.scrollIntoView({ behavior: "smooth" })}
        >
          ¡Ordena Ahora!
        </Button>
      </div>
    </section>
  )
}
