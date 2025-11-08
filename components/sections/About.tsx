"use client"
import Image from "next/image"

export function About() {
  return (
    <section id="about" className="py-20 px-4 bg-amber-100 scroll-mt-24">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="animate-fade-in-up">
            <h2 className="font-cursive text-4xl md:text-5xl text-[#8B4513] mb-6">Nuestra Dulce Historia</h2>
            <p className="text-lg text-gray-600 mb-6 text-pretty">
              Fundada en 2020 por Martha Isela Gardea, quien creía que todos merecen algo dulce y agradable para alegrar su día,
              Funny Rolls ha estado esparciendo alegría y amor con cada rollo, compartiendo su cuidado y cariño con cada persona que lo prueba.
            </p>
            <p className="text-lg text-gray-600 mb-6 text-pretty">
              Seleccionamos solo los mejores ingredientes y combinamos recetas tradicionales con un toque especial de alegría,
              horneando todo fresco cada día. Nuestra misión es sencilla: sacar sonrisas mientras deleitamos tu gusto por lo dulce.
            </p>
            <p className="text-lg text-gray-600 text-pretty">
              Cada bocado está hecho con amor, cada rollo tiene su propia chispa de diversión, y cada cliente se va con una sonrisa.
              ¡Esa es la promesa de Funny Rolls!
            </p>
          </div>

          <div className="animate-fade-in-up">
            <Image
              src="/img/bakery-shop.jpg"
              alt="Nuestra acogedora panadería"
              width={600}
              height={384}
              className="w-full h-96 object-cover rounded-lg shadow-lg"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
