"use client"
import Image from "next/image"

export function About() {
  return (
    <section id="about" className="py-20 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="animate-fade-in-up">
            <h2 className="font-cursive text-4xl md:text-5xl text-[#C48A6A] mb-6">Our Sweet Story</h2>
            <p className="text-lg text-gray-600 mb-6 text-pretty">
              Founded in 2020 by a group of friends who believed that laughter and cinnamon rolls go hand in hand,
              Funny Rolls has been spreading joy one swirl at a time.
            </p>
            <p className="text-lg text-gray-600 mb-6 text-pretty">
              We use only the finest ingredients, traditional recipes with a twist of humor, and bake everything fresh daily. 
              Our mission is simple: make people smile while satisfying their sweet tooth.
            </p>
            <p className="text-lg text-gray-600 text-pretty">
              Every bite is crafted with love, every roll tells a joke, and every customer leaves with a smile. That&apos;s the Funny Rolls promise!
            </p>
          </div>

          <div className="animate-fade-in-up">
            <Image
              src="/img/bakery-shop.jpg"
              alt="Our cozy bakery"
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
