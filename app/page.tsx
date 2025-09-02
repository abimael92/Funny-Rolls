"use client"

import { useState, useEffect } from "react"
import { ShoppingCart, Menu, X, Plus, Minus, Star, MapPin, Clock, Phone, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Image from "next/image";

interface Product {
  id: number
  name: string
  price: number
  image: string
  description: string
  rating: number
}

interface CartItem extends Product {
  quantity: number
}

const products: Product[] = [
  {
    id: 1,
    name: "Classic Giggle Roll",
    price: 4.99,
    image: "/classic-cinnamon-roll-with-icing.png",
    description: "Our signature cinnamon roll that'll make you giggle with joy",
    rating: 5,
  },
  {
    id: 2,
    name: "Chuckle Chocolate Roll",
    price: 5.99,
    image: "/chocolate-cinnamon-roll-with-chocolate-drizzle.png",
    description: "Double chocolate goodness that's seriously funny",
    rating: 5,
  },
  {
    id: 3,
    name: "Snicker Strawberry Swirl",
    price: 5.49,
    image: "/strawberry-cinnamon-roll-with-pink-icing.png",
    description: "Sweet strawberry twist that'll make you snicker",
    rating: 4.8,
  },
  {
    id: 4,
    name: "Belly Laugh Blueberry",
    price: 5.49,
    image: "/blueberry-cinnamon-roll-with-cream-cheese-icing.png",
    description: "Bursting with blueberries and belly laughs",
    rating: 4.9,
  },
  {
    id: 5,
    name: "Guffaw Glazed",
    price: 4.49,
    image: "/glazed-cinnamon-roll-with-sugar-glaze.png",
    description: "Simple, sweet, and guaranteed to make you guffaw",
    rating: 4.7,
  },
  {
    id: 6,
    name: "Chortle Caramel Crunch",
    price: 6.49,
    image: "/caramel-cinnamon-roll-with-crunchy-topping.png",
    description: "Crunchy caramel goodness that'll have you chortling",
    rating: 5,
  },
]

export default function FunnyRollsPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [cart, setCart] = useState<CartItem[]>([])
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id)
      if (existing) {
        return prev.map((item) => (item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item))
      }
      return [...prev, { ...product, quantity: 1 }]
    })
  }

  const removeFromCart = (productId: number) => {
    setCart((prev) => prev.filter((item) => item.id !== productId))
  }

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity === 0) {
      removeFromCart(productId)
      return
    }
    setCart((prev) => prev.map((item) => (item.id === productId ? { ...item, quantity } : item)))
  }

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0)
  }

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0)
  }

  return (
    <div className="min-h-screen bg-[#FFF5E6]">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-[#C48A6A]/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="font-cursive text-2xl text-[#C48A6A]">Funny Rolls</h1>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#home" className="text-gray-700 hover:text-[#C48A6A] transition-colors">
                Home
              </a>
              <a href="#menu" className="text-gray-700 hover:text-[#C48A6A] transition-colors">
                Menu
              </a>
              <a href="#about" className="text-gray-700 hover:text-[#C48A6A] transition-colors">
                About
              </a>
              <a href="#contact" className="text-gray-700 hover:text-[#C48A6A] transition-colors">
                Contact
              </a>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCartOpen(true)}
                className="relative border-[#C48A6A] text-[#C48A6A] hover:bg-[#C48A6A] hover:text-white"
              >
                <ShoppingCart className="h-4 w-4" />
                {getTotalItems() > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-[#FFC1C1] text-[#8B4513] text-xs">
                    {getTotalItems()}
                  </Badge>
                )}
              </Button>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCartOpen(true)}
                className="relative border-[#C48A6A] text-[#C48A6A]"
              >
                <ShoppingCart className="h-4 w-4" />
                {getTotalItems() > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-[#FFC1C1] text-[#8B4513] text-xs">
                    {getTotalItems()}
                  </Badge>
                )}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-t border-[#C48A6A]/20 animate-scale-in">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <a href="#home" className="block px-3 py-2 text-gray-700 hover:text-[#C48A6A]">
                Home
              </a>
              <a href="#menu" className="block px-3 py-2 text-gray-700 hover:text-[#C48A6A]">
                Menu
              </a>
              <a href="#about" className="block px-3 py-2 text-gray-700 hover:text-[#C48A6A]">
                About
              </a>
              <a href="#contact" className="block px-3 py-2 text-gray-700 hover:text-[#C48A6A]">
                Contact
              </a>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <Image src="/beautiful-cinnamon-rolls-on-rustic-wooden-table-wi.png" alt="Delicious cinnamon rolls" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/40"></div>
        </div>

        <div className={`relative z-10 text-center text-white px-4 ${isVisible ? "animate-fade-in-up" : "opacity-0"}`}>
          <h1 className="font-cursive text-4xl md:text-6xl lg:text-7xl mb-6 text-balance">
            Get Your Giggle and Your Swirl!
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-2xl mx-auto text-pretty">
            Deliciously funny cinnamon rolls that will make you laugh out loud and crave more
          </p>

          {/* Fresh-baked cinnamon rolls made daily with love, cinnamon, and a touch of magic. Every bite is pure bliss. */}

          <Button
            size="lg"
            className="bg-[#C48A6A] hover:bg-[#8B4513] text-white px-8 py-4 text-lg font-semibold rounded-full transform hover:scale-105 transition-all duration-300 shine-effect"
            onClick={() => document.getElementById("menu")?.scrollIntoView({ behavior: "smooth" })}
          >
            Order Now
          </Button>
        </div>
      </section>

      {/* Product Gallery */}
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
                className={`group hover:shadow-xl hover:scale-105 transition-all duration-300 border-[#C48A6A]/20 ${
                  isVisible ? "animate-fade-in-up" : "opacity-0"
                }`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardContent className="p-0">
                  <div className="relative overflow-hidden rounded-t-lg">
                    <Image
                      src={product.image || "/placeholder.svg"}
                      alt={product.name}
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

      {/* About Section */}
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
                We use only the finest ingredients, traditional recipes with a twist of humor, and bake everything fresh
                daily. Our mission is simple: make people smile while satisfying their sweet tooth.
              </p>
              <p className="text-lg text-gray-600 text-pretty">
                Every bite is crafted with love, every roll tells a joke, and every customer leaves with a smile. That&apos;s
                the Funny Rolls promise!
              </p>

              {/* Sweet Swirls began in 2018 when our founder, Sarah Martinez, decided to turn her grandmother's secret cinnamon roll recipe into something the whole community could enjoy. What started as weekend farmers market treats has blossomed into the neighborhood's favorite bakery.

Every morning at 5 AM, our bakers arrive to hand-roll each pastry with care. We use only the finest ingredients: organic flour, Madagascar vanilla, Ceylon cinnamon, and farm-fresh butter. No shortcuts, no preservatives—just pure, wholesome goodness.

Our mission is simple: to bring warmth and joy to every customer through the perfect cinnamon roll. Whether you're grabbing breakfast on the go or treating yourself to an afternoon indulgence, we're here to make your day a little sweeter.  



5000+
Happy Customers
200+
Rolls Daily
6
Years of Sweet

*/}
            </div>

            <div className="animate-fade-in-up">
              <Image
                src="/cozy-bakery-interior-with-warm-lighting-and-cinnam.png"
                alt="Our cozy bakery"
                className="w-full h-96 object-cover rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
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
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  className="w-full px-4 py-3 border border-[#C48A6A]/30 rounded-lg focus:ring-2 focus:ring-[#C48A6A] focus:border-transparent transition-all"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  className="w-full px-4 py-3 border border-[#C48A6A]/30 rounded-lg focus:ring-2 focus:ring-[#C48A6A] focus:border-transparent transition-all"
                  placeholder="your@email.com"
                />
              </div>
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                  Message
                </label>
                <textarea
                  id="message"
                  rows={4}
                  className="w-full px-4 py-3 border border-[#C48A6A]/30 rounded-lg focus:ring-2 focus:ring-[#C48A6A] focus:border-transparent transition-all"
                  placeholder="Tell us about your custom order or just say hi!"
                ></textarea>
              </div>
              <Button
                type="submit"
                className="w-full bg-[#C48A6A] hover:bg-[#8B4513] text-white py-3 transform hover:scale-105 transition-all duration-200"
              >
                Send Message
              </Button>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#8B4513] text-white py-12 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h3 className="font-cursive text-3xl text-[#FFC1C1] mb-4">Funny Rolls</h3>
          <p className="text-lg mb-6">Spreading smiles, one swirl at a time</p>
          {/* Freshly baked cinnamon rolls made with love and the finest ingredients. Every bite is a warm hug that brings joy to your day. */}
          <div className="flex justify-center space-x-6 mb-6">
            <a href="#" className="hover:text-[#FFC1C1] transition-colors">
              Facebook
            </a>
            <a href="#" className="hover:text-[#FFC1C1] transition-colors">
              Instagram
            </a>
            <a href="#" className="hover:text-[#FFC1C1] transition-colors">
              Twitter
            </a>
          </div>

          {/* Quick Links
Menu
About Us
Contact
Catering


Store Info
123 Baker Street
Sweet Valley, CA 90210
(555) 123-ROLL
Daily 7AM - 8PM */}

          <p className="text-sm opacity-75">© 2024 Funny Rolls. All rights reserved. Made with ❤️ and lots of cinnamon.</p>
        </div>
      </footer>

      {/* Shopping Cart Modal */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsCartOpen(false)}></div>
          <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl animate-scale-in">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">Your Cart</h2>
              <Button variant="ghost" size="sm" onClick={() => setIsCartOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {cart.length === 0 ? (
                <p className="text-center text-gray-500 mt-8">Your cart is empty</p>
              ) : (
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div key={item.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                      <Image
                        src={item.image || "/placeholder.svg"}
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded"
                      />
                      <div className="flex-1">
                        <h3 className="font-medium text-sm">{item.name}</h3>
                        <p className="text-[#C48A6A] font-semibold">${item.price}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm" onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <Button variant="outline" size="sm" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="border-t p-6">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg font-semibold">Total:</span>
                  <span className="text-xl font-bold text-[#C48A6A]">${getTotalPrice().toFixed(2)}</span>
                </div>
                <Button className="w-full bg-[#C48A6A] hover:bg-[#8B4513] text-white">Checkout</Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
