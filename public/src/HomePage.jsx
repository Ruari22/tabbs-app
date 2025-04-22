// Firebase integration for real-time sync
import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { useDrop } from 'react-dnd';
import { DndProvider, useDrag, HTML5Backend } from 'react-dnd-html5-backend';
import QrReader from 'react-qr-reader';
import QRCode from 'qrcode.react';
import { v4 as uuidv4 } from 'uuid';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, onSnapshot, updateDoc, arrayUnion } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBKE0f4VS4PNTA9xTNwZ_8rIDQ8STwkJ6M",
  authDomain: "tabbsapp-62987.firebaseapp.com",
  projectId: "tabbsapp-62987",
  storageBucket: "tabbsapp-62987.appspot.com",
  messagingSenderId: "976536107494",
  appId: "1:976536107494:web:abb2eeac2f802aee2f3e27",
  measurementId: "G-XMTTMNMR83"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const ShareTabbQR = ({ tabbId }) => {
  const url = `https://yourapp.com/?tabbId=${encodeURIComponent(tabbId)}`;
  return (
    <div className="mt-6 text-center">
      <h3 className="text-lg font-bold mb-2">Share This Tabb</h3>
      <p className="text-sm mb-2">Ask others to scan and join</p>
      <QRCode value={url} size={160} />
      <p className="text-xs mt-2 break-words">{url}</p>
    </div>
  );
};

const LiveParticipants = ({ participants }) => (
  <div className="mt-6">
    <h3 className="text-lg font-bold mb-2">Participants</h3>
    <ul className="list-disc list-inside text-sm">
      {participants.map((name, idx) => (
        <li key={idx}>{name}</li>
      ))}
    </ul>
  </div>
);

export default function HomePage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isMerchant, setIsMerchant] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [authCode, setAuthCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [tabbId, setTabbId] = useState(uuidv4());
  const [tabbName, setTabbName] = useState("");
  const [items, setItems] = useState([]);
  const [myTabb, setMyTabb] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const joinedTabbId = urlParams.get('tabbId');
    if (joinedTabbId) {
      setTabbId(joinedTabbId);
      const participantName = prompt("Enter your name to join the tabb:");
      if (participantName) {
        const ref = doc(db, 'tabbs', joinedTabbId);
        updateDoc(ref, { participants: arrayUnion(participantName) });
      }
    }
  }, []);

  useEffect(() => {
    const ref = doc(db, 'tabbs', tabbId);
    const unsub = onSnapshot(ref, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setItems(data.items || []);
        setParticipants(data.participants || []);
      }
    });
    return () => unsub();
  }, [tabbId]);

  useEffect(() => {
    const ref = doc(db, 'tabbs', tabbId);
    setDoc(ref, { items, participants }, { merge: true });
  }, [items, participants, tabbId]);

  const handleCheckout = () => {
    console.log("Checking out", {
      tabbId,
      tabbName,
      itemsPaid: myTabb,
      total: myTabb.reduce((sum, item) => sum + item.price, 0)
    });
  };

  const moveToTabb = (index) => {
    const selected = items[index];
    if (!myTabb.includes(selected)) {
      setMyTabb([...myTabb, selected]);
    }
  };

  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'ITEM',
    drop: (draggedItem) => moveToTabb(draggedItem.index),
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }));

  const DraggableItem = ({ item, index }) => {
    const [{ isDragging }, drag] = useDrag(() => ({
      type: 'ITEM',
      item: { index },
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    }));

    return (
      <Card ref={drag} className={`cursor-move ${isDragging ? 'opacity-50' : ''}`}>
        <CardContent className="flex justify-between p-4">
          <span>{item.name}</span>
          <span>R{item.price}</span>
        </CardContent>
      </Card>
    );
  };

  if (!isAuthenticated) {
    return (
      <main className="p-4 max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-4">Login to Start</h1>
        <Label htmlFor="phone">Phone Number</Label>
        <Input id="phone" placeholder="e.g. +27 600 000 000" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className="mb-4" />
        {!codeSent ? (
          <Button className="w-full" onClick={() => setCodeSent(true)}>Send Code</Button>
        ) : (
          <>
            <Label htmlFor="code">Enter Code</Label>
            <Input id="code" placeholder="1234" value={authCode} onChange={(e) => setAuthCode(e.target.value)} className="mb-4" />
            <Button className="w-full mb-2" onClick={() => setIsAuthenticated(true)}>Verify</Button>
            <Button variant="outline" className="w-full" onClick={() => setIsMerchant(true)}>Merchant Access</Button>
          </>
        )}
      </main>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <main className="p-4 max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Create Your Tabb</h1>

        <Card className="mb-6">
          <CardContent className="space-y-4 p-4">
            <Label htmlFor="tabbName">Name Your Tabb</Label>
            <Input
              id="tabbName"
              placeholder="e.g. Ruari's Dinner"
              value={tabbName}
              onChange={(e) => setTabbName(e.target.value)}
            />
          </CardContent>
        </Card>

        <Tabs defaultValue="select-items" className="mb-6">
          <TabsList>
            <TabsTrigger value="select-items">Select Items</TabsTrigger>
            <TabsTrigger value="checkout">Checkout</TabsTrigger>
          </TabsList>

          <TabsContent value="select-items">
            <div className="grid gap-3 mt-4">
              <h2 className="font-semibold">Available Items</h2>
              {items.map((item, index) => (
                <DraggableItem key={index} item={item} index={index} />
              ))}

              <div ref={drop} className={`border-2 border-dashed p-4 mt-6 rounded ${isOver ? 'bg-green-100' : 'bg-gray-50'}`}>
                <h3 className="text-lg font-bold mb-2">My Tabb</h3>
                {myTabb.map((item, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span>{item.name}</span>
                    <span>R{item.price}</span>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="checkout">
            <div className="space-y-4 mt-4">
              <h2 className="text-xl font-semibold">Summary</h2>
              {myTabb.map((item, idx) => (
                <div key={idx} className="flex justify-between">
                  <span>{item.name}</span>
                  <span>R{item.price}</span>
                </div>
              ))}
              <hr />
              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span>R{myTabb.reduce((sum, item) => sum + item.price, 0)}</span>
              </div>
              <Button onClick={handleCheckout} className="w-full">Proceed to Pay</Button>
            </div>
          </TabsContent>
          <ShareTabbQR tabbId={tabbId} />
          <LiveParticipants participants={participants} />
        </Tabs>
      </main>
    </DndProvider>
  );
}
