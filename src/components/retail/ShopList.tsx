import { useState, useEffect } from 'react';
import '../../styles/retail/ShopList.css';

interface Item {
  "Item ID": number;
  "Category": string;
  "Item Name": string;
  "Stock": number;
  "Cost": number;
  "Image"?: string;
}

interface Shop {
  "Shop Name": string;
  "Shop ID": number;
  "Location": string;
  "Inventory": Item[];
}

interface CartItem extends Item {
  quantity: number;
  selectedShop?: {
    "Shop ID": number;
    "Shop Name": string;
    "Location": string;
  };
}

interface ItemAvailability {
  "Item ID": number;
  "Item Name": string;
  "Category": string;
  "Cost": number;
  "Image"?: string;
  availability: {
    "Shop ID": number;
    "Shop Name": string;
    "Location": string;
    "Stock": number;
  }[];
}

const ShopList = () => {
  const [shops, setShops] = useState<Shop[]>([]);
  const [items, setItems] = useState<ItemAvailability[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
  const [totalCost, setTotalCost] = useState<number>(0);
  const [showShopSelector, setShowShopSelector] = useState<{
    item: ItemAvailability;
    callback: (shopId: number) => void;
  } | null>(null);

  useEffect(() => {
    const fetchShops = async () => {
      try {
        const response = await fetch('https://jsonblob.com/api/jsonBlob/1353250595338903552');
        const data = await response.json();
        setShops(data.shops);
        
        // Transform shop data into item-centric data
        const itemMap = new Map<number, ItemAvailability>();
        
        data.shops.forEach((shop: Shop) => {
          shop.Inventory.forEach((item: Item) => {
            if (!itemMap.has(item["Item ID"])) {
              itemMap.set(item["Item ID"], {
                "Item ID": item["Item ID"],
                "Item Name": item["Item Name"],
                "Category": item["Category"],
                "Cost": item["Cost"],
                "Image": item["Image"],
                availability: []
              });
            }
            
            itemMap.get(item["Item ID"])!.availability.push({
              "Shop ID": shop["Shop ID"],
              "Shop Name": shop["Shop Name"],
              "Location": shop["Location"],
              "Stock": item["Stock"]
            });
          });
        });
        
        setItems(Array.from(itemMap.values()));
      } catch (error) {
        console.error('Error fetching shop data:', error);
      }
    };

    fetchShops();
  }, []);

  useEffect(() => {
    const newTotalCost = cart.reduce((sum, item) => {
      return sum + (item.Cost * item.quantity);
    }, 0);
    setTotalCost(newTotalCost);
  }, [cart]);

  const generateTimeSlots = () => {
    const slots = [];
    const currentDate = new Date('2025-03-23T06:48:01Z');
    const currentHour = currentDate.getUTCHours();
    
    let startHour = currentHour;
    if (currentDate.getUTCMinutes() >= 30) {
      startHour = currentHour + 1;
    }

    for (let hour = startHour; hour < 21; hour++) {
      if (hour === currentHour && currentDate.getUTCMinutes() < 30) {
        slots.push(`${hour.toString().padStart(2, '0')}:30 - ${(hour + 1).toString().padStart(2, '0')}:00`);
      } else if (hour !== currentHour) {
        slots.push(`${hour.toString().padStart(2, '0')}:00 - ${hour.toString().padStart(2, '0')}:30`);
        slots.push(`${hour.toString().padStart(2, '0')}:30 - ${(hour + 1).toString().padStart(2, '0')}:00`);
      }
    }
    return slots;
  };

  const handleAddToCart = (item: ItemAvailability) => {
    if (item.availability.length === 1) {
      // If item is available in only one shop, add it directly
      const shop = item.availability[0];
      addToCartWithShop(item, shop["Shop ID"]);
    } else {
      // If item is available in multiple shops, show shop selector
      setShowShopSelector({
        item,
        callback: (shopId: number) => {
          addToCartWithShop(item, shopId);
          setShowShopSelector(null);
        }
      });
    }
  };

  const addToCartWithShop = (item: ItemAvailability, shopId: number) => {
    const selectedShop = item.availability.find(shop => shop["Shop ID"] === shopId);
    if (!selectedShop) return;

    setCart(prevCart => {
      const existingItem = prevCart.find(
        cartItem => cartItem["Item ID"] === item["Item ID"] && 
        cartItem.selectedShop?.["Shop ID"] === shopId
      );

      if (existingItem) {
        return prevCart.map(cartItem =>
          cartItem["Item ID"] === item["Item ID"] && 
          cartItem.selectedShop?.["Shop ID"] === shopId
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      }

      return [...prevCart, {
        "Item ID": item["Item ID"],
        "Item Name": item["Item Name"],
        "Category": item["Category"],
        "Cost": item["Cost"],
        "Stock": selectedShop["Stock"],
        quantity: 1,
        selectedShop: {
          "Shop ID": selectedShop["Shop ID"],
          "Shop Name": selectedShop["Shop Name"],
          "Location": selectedShop["Location"]
        }
      }];
    });
  };

  const removeFromCart = (itemId: number, shopId: number) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(
        item => item["Item ID"] === itemId && 
        item.selectedShop?.["Shop ID"] === shopId
      );

      if (existingItem && existingItem.quantity > 1) {
        return prevCart.map(item =>
          item["Item ID"] === itemId && 
          item.selectedShop?.["Shop ID"] === shopId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        );
      }
      return prevCart.filter(
        item => !(item["Item ID"] === itemId && 
        item.selectedShop?.["Shop ID"] === shopId)
      );
    });
  };

  const formatTime = (timeSlot: string) => {
    return timeSlot.split(' - ').map(time => {
      const [hours, minutes] = time.split(':');
      const period = Number(hours) >= 12 ? 'PM' : 'AM';
      const formattedHours = Number(hours) > 12 ? Number(hours) - 12 : Number(hours);
      return `${formattedHours}:${minutes} ${period}`;
    }).join(' - ');
  };

  return (
    <div className="shop-container">
      <div className="time-slot-selector">
        <select 
          value={selectedTimeSlot}
          onChange={(e) => setSelectedTimeSlot(e.target.value)}
          className="time-slot-select"
        >
          <option value="">Select Pickup Time</option>
          {generateTimeSlots().map(slot => (
            <option key={slot} value={slot}>{formatTime(slot)}</option>
          ))}
        </select>
      </div>

      <div className="items-grid">
        {items.map((item) => (
          <div key={item["Item ID"]} className="item-card">
            <div className="item-image">
              <div className="placeholder-image">
                📦
              </div>
            </div>
            <div className="item-details">
              <h3 className="item-name">{item["Item Name"]}</h3>
              <p className="item-category">{item["Category"]}</p>
              <p className="item-cost">₹{item["Cost"]}</p>
              <p className="item-availability">
                Available in {item.availability.length} store{item.availability.length !== 1 ? 's' : ''}
              </p>
              <button 
                className="add-to-cart-btn"
                onClick={() => handleAddToCart(item)}
                disabled={item.availability.every(shop => shop["Stock"] === 0)}
              >
                {item.availability.every(shop => shop["Stock"] === 0) 
                  ? 'Out of Stock' 
                  : 'Add to Cart'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {showShopSelector && (
        <div className="shop-selector-modal">
          <div className="shop-selector-content">
            <h3>Select Shop for {showShopSelector.item["Item Name"]}</h3>
            {showShopSelector.item.availability.map(shop => (
              <button
                key={shop["Shop ID"]}
                className="shop-select-btn"
                onClick={() => showShopSelector.callback(shop["Shop ID"])}
                disabled={shop["Stock"] === 0}
              >
                <div className="shop-select-info">
                  <span className="shop-name">{shop["Shop Name"]}</span>
                  <span className="shop-location">{shop["Location"]}</span>
                  <span className="shop-stock">Stock: {shop["Stock"]}</span>
                </div>
              </button>
            ))}
            <button 
              className="close-modal-btn"
              onClick={() => setShowShopSelector(null)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {cart.length > 0 && (
        <div className="cart-summary">
          <h3>Cart Summary</h3>
          <div className="cart-items">
            {cart.map(item => (
              <div key={`${item["Item ID"]}-${item.selectedShop?.["Shop ID"]}`} className="cart-item">
                <div className="cart-item-details">
                  <div className="cart-item-info">
                    <span className="cart-item-name">{item["Item Name"]}</span>
                    <span className="cart-item-shop">from {item.selectedShop?.["Shop Name"]}</span>
                  </div>
                  <div className="cart-item-controls">
                    <button 
                      className="quantity-btn"
                      onClick={() => item.selectedShop && removeFromCart(item["Item ID"], item.selectedShop["Shop ID"])}
                    >
                      -
                    </button>
                    <span className="quantity">{item.quantity}</span>
                    <button 
                      className="quantity-btn"
                      onClick={() => item.selectedShop && handleAddToCart({
                        ...item,
                        availability: [{
                          "Shop ID": item.selectedShop["Shop ID"],
                          "Shop Name": item.selectedShop["Shop Name"],
                          "Location": item.selectedShop["Location"],
                          "Stock": item["Stock"]
                        }]
                      })}
                      disabled={item.quantity >= item["Stock"]}
                    >
                      +
                    </button>
                  </div>
                  <span className="cart-item-cost">₹{item["Cost"] * item.quantity}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="cart-total">
            <span>Total:</span>
            <span>₹{totalCost}</span>
          </div>
          <button 
            className="checkout-btn"
            disabled={!selectedTimeSlot}
            onClick={() => {
              if (selectedTimeSlot) {
                const token = Math.random().toString(36).substr(2, 9).toUpperCase();
                alert(`Your pickup token is: ${token}\nPickup time: ${formatTime(selectedTimeSlot)}`);
              }
            }}
          >
            {selectedTimeSlot ? 'Proceed to Checkout' : 'Select Pickup Time'}
          </button>
        </div>
      )}
    </div>
  );
};

export default ShopList;