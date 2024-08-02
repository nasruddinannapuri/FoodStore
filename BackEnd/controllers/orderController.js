import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const frontend_url = "http://localhost:5173";

const placeOrder = async (req, res) => {
  try {
    const { items, amount, address, userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ success: false, message: "User ID is required" });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: "Items are required and must be an array" });
    }

    const newOrder = new orderModel({
      userId,
      items,
      amount,
      address,
    });
    await newOrder.save();
    await userModel.findByIdAndUpdate(userId, { cartData: {} });

    const line_items = items.map((item) => ({
      price_data: {
        currency: "inr",
        product_data: {
          name: item.name,
        },
        unit_amount: Math.round(item.price * 100 * 80), // Ensure it's an integer
      },
      quantity: item.quantity,
    }));

    line_items.push({
      price_data: {
        currency: "inr",
        product_data: {
          name: "Delivery Charges",
        },
        unit_amount: 200 * 80, // 2 * 100 * 80
      },
      quantity: 1,
    });

    const session = await stripe.checkout.sessions.create({
      line_items,
      mode: "payment",
      success_url: `${frontend_url}/verify?success=true&orderId=${newOrder._id}`,
      cancel_url: `${frontend_url}/verify?success=false&orderId=${newOrder._id}`,
    });

    res.json({ success: true, session_url: session.url });
  } catch (error) {
    console.error("Error in placeOrder:", error);
    res.status(500).json({ success: false, message: "Failed to place order" });
  }
};
const verifyOrder = async (req, res) => {
  const {orderId, success} = req.body;
  try {
    if (success == "true") {
      await orderModel.findByIdAndUpdate(orderId, { payment: true });
      res.json({ success: true, message: "Paid" });
    } else {
      await orderModel.findByIdAndDelete(orderId);
      res.json({ success: false, message: "Not Paid" });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

// user orders for frontend
const userOrders = async (req, res)=>{
  try {
    
    const orders = await orderModel.find({ userId: req.body.userId });
    res.json({success: true, data: orders});
  } catch (error) {
    console.log(error);
    res.json({success: false, message:"Error"});
  }

}

// listing orders for admin panel
const listOrders = async (req, res) => {
  try {
    //console.log("Fetching all orders");  // Log for function call
    const orders = await orderModel.find({});
    //console.log("Orders fetched from DB:", orders);  // Log fetched orders
    res.json({ success: true, data: orders });
  } catch (error) {
    console.error("Error fetching orders:", error);  // Log errors
    res.json({ success: false, message: "Error fetching orders" });
  }
};

// api for updating order status
const updateStatus = async (req, res) => {
  try {
    await orderModel.findByIdAndUpdate(req.body.orderId,{status:req.body.status})
    res.json({success: true, message: "Status Updated" });
  } catch (error) {
    console.log(error);
    res.json({success: false, message: "Error" });
  }
}

export { placeOrder, verifyOrder, userOrders, listOrders, updateStatus };
