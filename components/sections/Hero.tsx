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
          alt="Delicious cinnamon rolls"
          width={1200}
          height={800}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40"></div>
      </div>

      {/* Content */}
      <div className={`relative z-10 text-center text-white px-4 ${isVisible ? "animate-fade-in-up" : "opacity-0"}`}>
        <h1 className="font-cursive text-4xl md:text-6xl lg:text-7xl mb-6 text-balance">
          Get Your Giggle and Your Swirl!
        </h1>
        <p className="text-xl md:text-2xl mb-8 max-w-2xl mx-auto text-pretty">
          Deliciously funny cinnamon rolls that will make you laugh out loud and crave more
        </p>
        <Button
          size="lg"
          className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-orange-600 hover:via-amber-600 hover:to-orange-700 text-white px-8 py-4 text-lg font-semibold rounded-full transform hover:scale-105 transition-all duration-300 shadow-lg"
          onClick={() => document.getElementById("menu")?.scrollIntoView({ behavior: "smooth" })}
        >
          Order Now
        </Button>
      </div>
    </section>
  )
}
