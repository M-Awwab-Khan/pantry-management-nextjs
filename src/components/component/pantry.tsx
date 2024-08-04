/** Add fonts into your Next.js project:

import { Inter } from 'next/font/google'

inter({
  subsets: ['latin'],
  display: 'swap',
})

To read more about using these font, please visit the Next.js documentation:
- App Directory: https://nextjs.org/docs/app/building-your-application/optimizing/fonts
- Pages Directory: https://nextjs.org/docs/pages/building-your-application/optimizing/fonts
**/
"use client"
import { PlusIcon, MinusIcon, Trash2, Plus, Sparkles, ArrowRightIcon } from "lucide-react"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { db } from "./firebase-auth";
const { GoogleGenerativeAI } = require("@google/generative-ai");
import dotenv from "dotenv";
import Markdown from 'react-markdown'

dotenv.config();

import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";

// Converts local file information to a GoogleGenerativeAI.Part object.
function fileToGenerativePart(imageBase64) {
  return [
    { text: "Describe this image in no more than 3 words" },
    {
      inlineData: {
        mimeType: "image/jpeg",
        data: imageBase64,
      },
    },
  ];
}

const genAI = new GoogleGenerativeAI(`${process.env.NEXT_PUBLIC_GEMINI_API_KEY}`);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });


export function Pantry() {
  const [inventory, setInventory] = useState([])
  const [newItem, setNewItem] = useState({
    name: "",
    quantity: 0,
    image: "",
  })

  const [showModal, setShowModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [recipes, setRecipes] = useState([]);
  const [selectedRecipe, setSelectedRecipe] = useState(null)

  useEffect(() => {
    fetchInventory();
    fetchRecipes();
  }, []);

  const fetchInventory = async () => {
    const querySnapshot = await getDocs(collection(db, "inventory"));
    const items = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setInventory(items);
  };

  const addItem = async () => {
    if (newItem.name && newItem.quantity > 0 && newItem.image) {
      const docRef = await addDoc(collection(db, "inventory"), newItem);
      setInventory([...inventory, { ...newItem, id: docRef.id }]);
      setNewItem({ name: "", quantity: 0, image: "" });
      setShowModal(false);
    }
  };


  const removeItem = async (id) => {
    await deleteDoc(doc(db, "inventory", id));
    setInventory(inventory.filter((item) => item.id !== id));
  };

  const increaseQuantity = async (id) => {
    const item = inventory.find((item) => item.id === id);
    if (item) {
      const updatedItem = { ...item, quantity: item.quantity + 1 };
      await updateDoc(doc(db, "inventory", id), updatedItem);
      setInventory(
        inventory.map((item) =>
          item.id === id ? updatedItem : item
        )
      );
    }
  };

  const decreaseQuantity = async (id) => {
    const item = inventory.find((item) => item.id === id);
    if (item && item.quantity > 0) {
      const updatedItem = { ...item, quantity: item.quantity - 1 };
      await updateDoc(doc(db, "inventory", id), updatedItem);
      setInventory(
        inventory.map((item) =>
          item.id === id ? updatedItem : item
        )
      );
    }
  };
  const handleImageUpload = (e) => {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewItem({ ...newItem, image: reader.result });
      };
      if (file) {
        reader.readAsDataURL(file);
      }
    };


    const filteredInventory = inventory.filter((item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const classifyImage = async (e) => {
      try {
        const promptConfig = fileToGenerativePart(newItem.image.split(",")[1]);
        const result = await model.generateContent({
          contents: [{ role: "user", parts: promptConfig }],
        });

        const response = await result.response;
        const aiTitle = response.text();
        setNewItem({ ...newItem, name: aiTitle });
        console.log(aiTitle);
      } catch (error) {
        console.error("Error classifying image:", error);
      }
    }

    const suggestRecipe = async () => {
      try {
        const inventoryItems = inventory.map(item => `${item.quantity}x ${item.name}`).join(", ");
        const prompt = `Suggest a recipe using the following ingredients: ${inventoryItems}. Make sure you give response in this format:
        {
            title: "Vegetable Stir-Fry",
            excerpt: "A colorful and flavorful stir-fry with a variety of fresh vegetables and a savory sauce",
            content: "FULL RECIPE CONTENT HERE"
        }`;

        const result = await model.generateContent(prompt);

        const response = await result.response;
        let recipe = response.text();
        recipe = JSON.parse(recipe);

        // Save the generated recipe to Firestore
        const docRef = await addDoc(collection(db, "recipes"), recipe);

        // Fetch updated recipes list
        fetchRecipes();

        openRecipeModal(recipe);
      } catch (error) {
        console.error("Error suggesting recipe:", error);
      }
    };

    const fetchRecipes = async () => {
        const querySnapshot = await getDocs(collection(db, "recipes"));
        const recipes = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setRecipes(recipes);
      };


    const openRecipeModal = (recipe) => {
        setSelectedRecipe(recipe)
        setShowRecipeModal(true)
      }

  return (
    <div className="container mx-auto px-4 md:px-6 py-8 grid grid-cols-2 lg:grid-cols-[1fr_300px] gap-8 ">
    <div>
      <div className="flex items-center justify-between mb-6">
      <h1 className="text-2xl font-bold">Pantry Management</h1>

        <div className="flex items-center space-x-4">
          <Input
            placeholder="Search by item name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full max-w-xs"
          />
          <Button onClick={() => setShowModal(true)}>Add Item</Button>
          <Button onClick={suggestRecipe}>Suggest Recipe</Button>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredInventory.map((item) => (
          <Card key={item.id}>
            <img
              src={item.image}
              alt={item.name}
              width={200}
              height={200}
              className="w-full h-48 object-cover rounded-t-lg"
            />
            <CardContent className="p-4">
              <h3 className="text-lg font-semibold">{item.name}</h3>
              <p className="text-muted-foreground">Quantity: {item.quantity}</p>
              <div className="flex items-center justify-between mt-4">
              <div className="flex items-center space-x-4">
                <Button size="icon" variant="outline" onClick={() => decreaseQuantity(item.id)}>
                  <MinusIcon className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="outline" onClick={() => increaseQuantity(item.id)}>
                  <PlusIcon className="h-4 w-4" />
                </Button>
              </div>
                <Button size="sm" variant="destructive" onClick={() => removeItem(item.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      </div>
      <div className="bg-muted/20 rounded-lg p-4 space-y-4">
        <h2 className="text-lg font-semibold">Recipes</h2>
        <div className="space-y-2">
          {recipes.map((recipe) => (
            <div
              key={recipe.id}
              className="flex items-start justify-between gap-4 hover:bg-muted/50 rounded-md p-2 transition-colors"
            >
              <div>
                <h3 className="font-medium">{recipe.title}</h3>
                <p className="text-muted-foreground text-sm line-clamp-2">{recipe.excerpt}</p>
              </div>
              <Button size="icon" variant="ghost" onClick={() => openRecipeModal(recipe)}>
                <ArrowRightIcon className="w-4 h-4" />
                <span className="sr-only">Read more</span>
              </Button>
            </div>
          ))}
        </div>
      </div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Item</DialogTitle>
            <DialogDescription>Fill out the form to add a new item to your inventory.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid items-center grid-cols-4 gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={newItem.name}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid items-center grid-cols-4 gap-4">
              <Label htmlFor="quantity" className="text-right">
                Quantity
              </Label>
              <Input
                id="quantity"
                type="number"
                value={newItem.quantity}
                onChange={(e) =>
                  setNewItem({
                    ...newItem,
                    quantity: parseInt(e.target.value),
                  })
                }
                className="col-span-3"
              />
            </div>
            <div className="grid items-center grid-cols-4 gap-4">
              <Label htmlFor="image" className="text-right">
                Image URL
              </Label>
              <Input
                id="image"
                type="file"
                onChange={handleImageUpload}
                className="col-span-3"
              />
            </div>

          </div>
          <DialogFooter className="sm:justify-between">
            <Button onClick={classifyImage} disabled={!newItem.image} variant="secondary">
                <Sparkles className="mr-2 h-4 w-4" />   Classify
            </Button>

            <div className="flex space-x-2">
                <Button onClick={addItem}>
                    <Plus className="mr-2 h-4 w-4" />Add
                </Button>
                <Button variant="outline" onClick={() => {setShowModal(false); setNewItem({ ...newItem, image: "" });}}>Cancel</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    <Dialog open={showRecipeModal} onOpenChange={setShowRecipeModal}>
        <DialogContent className="sm:max-w-[600px] max-h-[600px] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedRecipe?.title}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <p>{selectedRecipe?.excerpt}</p>
            <p>
              <Markdown>{selectedRecipe?.content}</Markdown>
            </p>
          </div>
          <DialogFooter>
            <div>
              <Button variant="outline">Close</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
