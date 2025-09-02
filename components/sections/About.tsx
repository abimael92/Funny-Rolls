"use client"
import Image from "next/image"

export function About() {
  return (
    <section id="about" className="py-20 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="animate-fade-in-up">
            <h2 className="font-cursive text-4xl md:text-5xl text-[#C48A6A] mb-6">Nuestra Dulce Historia</h2>
            <p className="text-lg text-gray-600 mb-6 text-pretty">
              Fundada en 2020 por un grupo de amigos que creían que la risa y los rollos de canela van de la mano, 
              Funny Rolls ha estado esparciendo alegría un remolino a la vez.
            </p>
            <p className="text-lg text-gray-600 mb-6 text-pretty">
              Usamos solo los mejores ingredientes, recetas tradicionales con un toque de humor, y horneamos todo fresco a diario. 
              Nuestra misión es simple: hacer sonreír a las personas mientras satisfacemos su gusto por lo dulce.
            </p>
            <p className="text-lg text-gray-600 text-pretty">
              Cada bocado se crea con amor, cada rollo cuenta un chiste, y cada cliente se va con una sonrisa. ¡Esa es la promesa de Funny Rolls!
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
