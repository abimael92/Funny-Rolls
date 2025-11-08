"use client"

import { Product } from "@/lib/types"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import { Star } from "lucide-react"

interface MenuSectionProps {
  products: Product[]
  addToCart: (product: Product) => void
}

export function MenuSection({ products, addToCart }: MenuSectionProps) {
  return (
    <section id="menu" className="py-20 px-4 scroll-mt-24">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="font-cursive text-4xl md:text-5xl text-[#C48A6A] mb-4 ">Nuestro Divertido Menú</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto text-pretty">
            Cada rollo se hornea fresco todos los días con amor, risas y los mejores ingredientes
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product, index) => (
            <Card
              key={product.id}
              className={`group transition-all duration-300 border-2 p-0
                bg-[#8B4513]/30 border-[#C48A6A] overflow-hidden
                ${product.available
                  ? 'hover:shadow-xl hover:scale-105 cursor-pointer'
                  : 'opacity-90 cursor-not-allowed'
                }`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardContent className="p-0">
                <div className="relative overflow-hidden rounded-t-lg">
                  <Image
                    src={product.image || "/placeholder.svg"}
                    alt={product.name}
                    width={300}
                    height={256}
                    className={`w-full h-64 object-cover transition-transform duration-300 ${product.available ? 'group-hover:scale-110' : ''
                      }`}
                  />

                  {/* Sold Out Banner */}
                  {!product.available && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <div className="bg-red-600 text-white px-6 py-3 rotate-[-5deg] transform text-xl font-bold tracking-wider">
                        ¡AGOTADO!
                      </div>
                    </div>
                  )}

                  <div className="absolute top-4 right-4">
                    <Badge className="bg-[#000] text-[#8B4513]">
                      <Star className="h-3 w-3 mr-1 fill-current" />
                      {product.rating}
                    </Badge>
                  </div>
                </div>

                <div className="p-6 ">
                  <h3 className="font-cursive text-3xl text-[#8B4513] mb-2">{product.name}</h3>
                  <p className="text-gray-600 mb-4 text-md">{product.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-[#8B4513]">${product.price}<span className="text-sm align-super">.00</span></span>
                    <Button
                      onClick={() => addToCart(product)}
                      className={`transform transition-all duration-200 ${product.available
                        ? 'bg-[#B55519]/80 text-black hover:bg-[#C48A6A] hover:text-white hover:scale-105 cursor-pointer'
                        : 'bg-gray-600 text-gray-200 cursor-not-allowed hover:bg-gray-600'
                        }`}
                    >
                      Añadir al Carrito
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
