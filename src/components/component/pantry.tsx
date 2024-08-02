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
import { PlusIcon, MinusIcon, Trash2, Trash } from "lucide-react"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { db } from "./firebase-auth";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";

export function Pantry() {
  const [inventory, setInventory] = useState([])
  const [newItem, setNewItem] = useState({
    name: "",
    quantity: 0,
    image: "",
  })

  const [showModal, setShowModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    fetchInventory();
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

  return (
    <div className="container mx-auto px-4 md:px-6 py-8">
      <div className="flex items-center justify-between mb-6">
      <h1 className="text-2xl font-bold">Inventory Management</h1>

        <div className="flex items-center space-x-4">
          <Input
            placeholder="Search by item name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full max-w-xs"
          />
          <Button onClick={() => setShowModal(true)}>Add Item</Button>
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
          <DialogFooter>
            <Button onClick={addItem}>Add Item</Button>
            <div>
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
