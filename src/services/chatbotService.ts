/**
 * Chatbot Service - Handles all chatbot logic and responses
 */

export interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: Date;
  quickReplies?: QuickReply[];
}

export interface QuickReply {
  text: string;
  action: string;
}

export interface ChatbotContext {
  products?: any[];
  userRole?: 'buyer' | 'seller';
  cartCount?: number;
}

const QUICK_REPLIES = {
  greeting: [
    { text: '🔍 Search Products', action: 'search' },
    { text: '🛒 Cart Help', action: 'cart_help' },
    { text: '❓ FAQs', action: 'faqs' },
  ],
  search: [
    { text: '👕 Fashion', action: 'category:Fashion' },
    { text: '📱 Electronics', action: 'category:Electronics' },
    { text: '📚 Books', action: 'category:Books' },
    { text: '🏠 All Categories', action: 'all_categories' },
  ],
  faq: [
    { text: '📦 Shipping Info', action: 'shipping' },
    { text: '🔄 Returns Policy', action: 'returns' },
    { text: '💰 Payment Methods', action: 'payment' },
    { text: '🎯 Back to Main Menu', action: 'menu' },
  ],
};

const RESPONSES = {
  greeting: `👋 Welcome to Your Cart Assistant! I'm here to help you with:
  
• 🛍️ **Product Search** - Find products by name or category
• 🛒 **Cart & Checkout** - Manage your shopping cart
• ❓ **Support** - Get answers to common questions

How can I assist you today?`,

  search_help: `🔍 **Product Search**
  
I can help you find products! You can say things like:
- "Show me electronics"
- "Find wireless headphones"
- "What do you have in Fashion?"
- "I'm looking for books"

What would you like to search for?`,

  cart_help: `🛒 **Cart Assistance**

I can help with:
- Adding items to your cart
- Viewing cart summary
- Checkout process questions
- Stock availability info

What would you like to know?`,

  faqs: `❓ **Frequently Asked Questions**

Popular topics:
- **Shipping:** Learn about delivery times and costs
- **Returns:** Our return and exchange policy
- **Payment:** Accepted payment methods
- **Account:** Login and seller registration help

Select a topic above or ask me anything!`,

  shipping: `📦 **Shipping Information**

✓ Standard Delivery: 3-5 business days
✓ Express Delivery: 1-2 business days
✓ Free shipping on orders above ₹500
✓ Track your order anytime

Need more help with shipping?`,

  returns: `🔄 **Returns & Exchange Policy**

✓ 30-day return window from delivery
✓ Item must be unused and original packaging intact
✓ Full refund to original payment method
✓ Free return shipping on defective items

Questions about a specific order?`,

  payment: `💰 **Payment Methods**

We accept:
✓ Credit/Debit Cards (Visa, Mastercard, Amex)
✓ UPI (Google Pay, PhonePe, Paytm)
✓ Net Banking
✓ Digital Wallets (Apple Pay)
✓ EMI options available

Secure checkout guaranteed! 🔒`,

  seller_greeting: `👋 Welcome Seller! I'm your assistant for:

• 📦 **Product Management** - Add, edit, delete products
• 📊 **Sales Info** - Track your listings
• ❓ **Seller Support** - Account and setup help

What can I help with?`,

  seller_help: `📦 **Seller Resources**

- How to add a new product
- Editing product details
- Pricing and stock management
- Seller account FAQs

What do you need help with?`,

  not_found: `😕 I didn't quite understand that. Let me help you better!

Try saying:
- "Search for products"
- "Help with my cart"
- "Show me FAQs"
- "I'm a seller"

Or just ask me anything! 💬`,
};

class ChatbotService {
  private conversationHistory: Message[] = [];

  /**
   * Load conversation history from localStorage
   */
  loadHistory(): Message[] {
    try {
      const saved = localStorage.getItem('chatbot_history');
      if (saved) {
        this.conversationHistory = JSON.parse(saved).map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        }));
      }
    } catch (error) {
      this.conversationHistory = [];
    }
    return this.conversationHistory;
  }

  /**
   * Save conversation history to localStorage
   */
  saveHistory(): void {
    try {
      localStorage.setItem('chatbot_history', JSON.stringify(this.conversationHistory));
    } catch (error) {
    }
  }

  /**
   * Get initial greeting based on user role
   */
  getGreeting(userRole?: 'buyer' | 'seller'): Message {
    const id = Date.now().toString();
    const isSeller = userRole === 'seller';
    const text = isSeller ? RESPONSES.seller_greeting : RESPONSES.greeting;
    const quickReplies = isSeller
      ? [
          { text: '📦 Add Product Help', action: 'product_help' },
          { text: '📊 Seller Support', action: 'seller_help' },
        ]
      : QUICK_REPLIES.greeting;

    const message: Message = {
      id,
      sender: 'bot',
      text,
      timestamp: new Date(),
      quickReplies,
    };

    this.conversationHistory.push(message);
    this.saveHistory();
    return message;
  }

  /**
   * Process user message and generate response
   */
  async processMessage(userMessage: string, context?: ChatbotContext): Promise<Message[]> {
    // Add user message
    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: userMessage.trim(),
      timestamp: new Date(),
    };
    this.conversationHistory.push(userMsg);
    this.saveHistory();

    // Simulate typing delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Generate bot response
    const botMsg = this.generateResponse(userMessage.toLowerCase());
    this.conversationHistory.push(botMsg);
    this.saveHistory();

    return [botMsg];
  }

  /**
   * Generate appropriate bot response based on user input
   */
  private generateResponse(userInput: string): Message {
    const id = Date.now().toString();
    let text = '';
    let quickReplies: QuickReply[] | undefined;

    // Check for keywords and intent
    if (
      userInput.includes('search') ||
      userInput.includes('find') ||
      userInput.includes('product') ||
      userInput.includes('looking for')
    ) {
      text = RESPONSES.search_help;
      quickReplies = QUICK_REPLIES.search;
    } else if (
      userInput.includes('cart') ||
      userInput.includes('checkout') ||
      userInput.includes('add to cart')
    ) {
      text = RESPONSES.cart_help;
      quickReplies = QUICK_REPLIES.faq;
    } else if (userInput.includes('faq') || userInput.includes('help')) {
      text = RESPONSES.faqs;
      quickReplies = QUICK_REPLIES.faq;
    } else if (userInput.includes('shipping') || userInput.includes('delivery')) {
      text = RESPONSES.shipping;
      quickReplies = QUICK_REPLIES.faq;
    } else if (userInput.includes('return') || userInput.includes('exchange')) {
      text = RESPONSES.returns;
      quickReplies = QUICK_REPLIES.faq;
    } else if (userInput.includes('payment') || userInput.includes('pay')) {
      text = RESPONSES.payment;
      quickReplies = QUICK_REPLIES.faq;
    } else if (
      userInput.includes('seller') ||
      userInput.includes('add product') ||
      userInput.includes('manage product')
    ) {
      text = RESPONSES.seller_help;
      quickReplies = [
        { text: '➕ Add New Product Steps', action: 'add_product' },
        { text: '✏️ Edit Product Guide', action: 'edit_product' },
      ];
    } else if (userInput.includes('electronics')) {
      text = `📱 **Electronics**

Popular electronics in our store:
• Wireless Headphones
• USB-C Cables
• Phone Cases
• Laptop Accessories
• Smart Watches

Would you like to see more details or search for something specific?`;
      quickReplies = QUICK_REPLIES.search;
    } else if (userInput.includes('fashion')) {
      text = `👕 **Fashion**

Categories available:
• Casual Wear
• Formal Wear
• Sports Wear
• Accessories
• Seasonal Collections

Browse by category or search for specific items!`;
      quickReplies = QUICK_REPLIES.search;
    } else if (userInput.includes('book')) {
      text = `📚 **Books**

Find our collection:
• Fiction & Literature
• Self-Help & Motivation
• Educational
• Comics & Manga
• Audiobooks

What type of book are you looking for?`;
      quickReplies = QUICK_REPLIES.search;
    } else if (userInput === 'menu' || userInput.includes('main menu')) {
      text = RESPONSES.greeting;
      quickReplies = QUICK_REPLIES.greeting;
    } else {
      text = RESPONSES.not_found;
      quickReplies = QUICK_REPLIES.greeting;
    }

    return {
      id,
      sender: 'bot',
      text,
      timestamp: new Date(),
      quickReplies,
    };
  }

  /**
   * Get conversation history
   */
  getHistory(): Message[] {
    return this.conversationHistory;
  }

  /**
   * Clear conversation history
   */
  clearHistory(): void {
    this.conversationHistory = [];
    localStorage.removeItem('chatbot_history');
  }
}

export const chatbotService = new ChatbotService();
