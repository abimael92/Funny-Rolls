"use client"

import { Product, CartItem } from "@/lib/types"
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
    <section id="menu" className="py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="font-cursive text-4xl md:text-5xl text-[#C48A6A] mb-4">Our Funny Menu</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto text-pretty">
            Each roll is baked fresh daily with love, laughter, and the finest ingredients
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product, index) => (
            <Card
              key={product.id}
              className={`group hover:shadow-xl hover:scale-105 transition-all duration-300 border-[#C48A6A]/20`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardContent className="p-0">
                <div className="relative overflow-hidden rounded-t-lg">
                  <Image
                    src={product.image || "/placeholder.svg"}
                    alt={product.name}
                    width={300}
                    height={256}
                    className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute top-4 right-4">
                    <Badge className="bg-[#FFC1C1] text-[#8B4513]">
                      <Star className="h-3 w-3 mr-1 fill-current" />
                      {product.rating}
                    </Badge>
                  </div>
                </div>

                <div className="p-6">
                  <h3 className="font-cursive text-xl text-[#C48A6A] mb-2">{product.name}</h3>
                  <p className="text-gray-600 mb-4 text-sm">{product.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-[#8B4513]">${product.price}</span>
                    <Button
                      onClick={() => addToCart(product)}
                      className="bg-[#FFC1C1] hover:bg-[#C48A6A] text-[#8B4513] hover:text-white transform hover:scale-105 transition-all duration-200"
                    >
                      Add to Cart
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
