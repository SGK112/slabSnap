export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

export const faqData: FAQItem[] = [
  // Getting Started
  {
    id: "faq-1",
    question: "How do I post a listing?",
    answer: "To post a listing:\n\n1. Tap the 'Sell' tab at the bottom of the screen\n2. Add photos of your stone (up to 7 photos)\n3. Fill in the details: title, description, stone type, and price\n4. Add your location and optional dimensions\n5. Tap 'Post Listing'\n\nYour listing will be live immediately and will expire after 72 hours. You can manage your listings from the 'My Listings' tab.",
    category: "Getting Started"
  },
  {
    id: "faq-2",
    question: "How do I contact a seller?",
    answer: "To contact a seller:\n\n1. Open any listing you're interested in\n2. Tap the 'Message Seller' button at the bottom\n3. This will start a conversation in the Messages tab\n\nNote: You must be logged in to message sellers. All conversations are linked to the specific listing for easy reference.",
    category: "Getting Started"
  },
  {
    id: "faq-3",
    question: "How do I create an account?",
    answer: "Creating an account is simple:\n\n1. Tap 'Sign Up' on the landing screen\n2. Enter your name, email, and password\n3. Tap 'Sign Up' to complete registration\n\nYou'll receive 5 free credits to get started. Your account lets you post listings, message other users, and track your activity.",
    category: "Getting Started"
  },
  
  // Buying & Selling
  {
    id: "faq-4",
    question: "How do payments work?",
    answer: "cutStone connects buyers and sellers directly:\n\n• All payments are arranged between buyer and seller\n• We recommend meeting in person for local transactions\n• For shipped items, use secure payment methods like PayPal or Venmo\n• Never send money before inspecting the stone\n• Always get a receipt for your transaction\n\ncutStone does not process payments directly - we're a marketplace that facilitates connections.",
    category: "Buying & Selling"
  },
  {
    id: "faq-5",
    question: "What are the listing guidelines?",
    answer: "When creating a listing, please follow these guidelines:\n\n✓ Use clear, well-lit photos\n✓ Accurately describe the stone type and condition\n✓ Include dimensions when possible\n✓ Set fair, competitive prices\n✓ Provide your location\n✓ Respond promptly to messages\n\n✗ No misleading descriptions\n✗ No stock photos (use actual photos)\n✗ No duplicate listings\n✗ No non-stone materials\n\nListings that violate guidelines may be removed.",
    category: "Buying & Selling"
  },
  {
    id: "faq-6",
    question: "Can I negotiate prices?",
    answer: "Yes! Price negotiation is encouraged:\n\n• Use the messaging feature to make offers\n• Be respectful and reasonable\n• Sellers can accept, counter, or decline\n• Both parties should agree before meeting\n\nRemember: Listed prices are starting points. Many successful transactions happen through friendly negotiation.",
    category: "Buying & Selling"
  },
  {
    id: "faq-7",
    question: "How do I inspect stone before buying?",
    answer: "Always inspect stone in person before purchasing:\n\n✓ Check for cracks, chips, or damage\n✓ Verify dimensions match the listing\n✓ Look at all sides and edges\n✓ Check color consistency\n✓ Ask about the stone's history\n✓ Take your own photos\n\n⚠️ Meet in safe, public places\n⚠️ Bring a friend if possible\n⚠️ Never send money before inspection",
    category: "Buying & Selling"
  },
  
  // Managing Listings
  {
    id: "faq-8",
    question: "Can I edit my listing after posting?",
    answer: "Currently, you cannot edit listings after posting. However, you can:\n\n• Delete the listing from 'My Listings'\n• Create a new listing with updated information\n• Mark items as sold when they're no longer available\n\nWe're working on adding edit functionality in a future update. Make sure all details are correct before posting!",
    category: "Managing Listings"
  },
  {
    id: "faq-9",
    question: "How long do listings stay active?",
    answer: "Listings automatically expire after 72 hours (3 days).\n\nAfter expiration:\n• The listing moves to 'Archived' in 'My Listings'\n• It's no longer visible to other users\n• You can create a new listing anytime\n\nThis keeps the marketplace fresh and ensures only active inventory is shown to buyers.",
    category: "Managing Listings"
  },
  {
    id: "faq-10",
    question: "How do I mark an item as sold?",
    answer: "To mark an item as sold:\n\n1. Go to the 'My Listings' tab\n2. Find your listing under 'Active'\n3. Tap 'Mark as Sold'\n4. The listing will update its status\n\nMarking items as sold helps maintain marketplace accuracy and shows buyers you're responsive.",
    category: "Managing Listings"
  },
  {
    id: "faq-11",
    question: "Can I delete a listing?",
    answer: "Yes, you can delete listings at any time:\n\n1. Open the 'My Listings' tab\n2. Find the listing you want to remove\n3. Tap 'Delete'\n4. Confirm the deletion\n\nDeleted listings cannot be recovered. If you might relist the item, consider marking it as sold instead.",
    category: "Managing Listings"
  },
  
  // Safety & Trust
  {
    id: "faq-12",
    question: "How do I report a problem?",
    answer: "You can report issues through:\n\n1. Profile → Help & Support → Report an Issue\n2. Tap the flag icon on any listing\n3. Email support@surprisegranite.com\n\nInclude details like listing ID, screenshots, and description of the problem. We review all reports within 24 hours.",
    category: "Safety & Trust"
  },
  {
    id: "faq-13",
    question: "What if a seller doesn't respond?",
    answer: "If a seller isn't responding:\n\n1. Wait 24 hours - they may be busy\n2. Send a polite follow-up message\n3. Check if the listing is still active\n4. Consider other similar listings\n5. Report unresponsive sellers to support\n\nSellers are encouraged to respond within 24 hours. Consistently unresponsive sellers may have their accounts reviewed.",
    category: "Safety & Trust"
  },
  {
    id: "faq-14",
    question: "How do I stay safe when meeting buyers/sellers?",
    answer: "Follow these safety guidelines:\n\n✓ Meet in public places (parking lots, shops)\n✓ Bring a friend or family member\n✓ Meet during daylight hours\n✓ Tell someone where you're going\n✓ Trust your instincts\n✓ Inspect items thoroughly\n\n✗ Never meet in private homes\n✗ Don't share personal financial info\n✗ Don't send money in advance\n✗ Don't share your address publicly",
    category: "Safety & Trust"
  },
  {
    id: "faq-15",
    question: "What is the user rating system?",
    answer: "After transactions, users can rate each other:\n\n⭐ 5 stars = Excellent experience\n⭐ 4 stars = Good experience  \n⭐ 3 stars = Okay experience\n⭐ 2 stars = Poor experience\n⭐ 1 star = Very bad experience\n\nRatings help build trust in the community. High-rated sellers are more likely to attract buyers. Always be honest, responsive, and professional.",
    category: "Safety & Trust"
  },
  
  // Account & Features
  {
    id: "faq-16",
    question: "What are credits and how do I earn them?",
    answer: "Credits are rewards for being active on cutStone:\n\nEarn credits by:\n• Signing up (5 free credits)\n• Posting your first listing (10 credits)\n• Daily login streaks\n• Referring friends (20 credits each)\n• Completing transactions\n\nCredits can be used for:\n• Featured listings (coming soon)\n• Extended listing duration (coming soon)\n• Premium features (coming soon)",
    category: "Account & Features"
  },
  {
    id: "faq-17",
    question: "What are streaks and levels?",
    answer: "Streaks track your daily activity:\n\n🔥 Login daily to maintain your streak\n📈 Longer streaks unlock rewards\n🏆 Level up by earning XP through activity\n\nBenefits:\n• Level 5: Priority listing placement\n• Level 10: Featured seller badge\n• Level 15: Extended listing duration\n• Level 20: Premium support access\n\nStay active to level up faster!",
    category: "Account & Features"
  },
  {
    id: "faq-18",
    question: "How do referrals work?",
    answer: "Share cutStone with friends and earn rewards:\n\n1. Find your referral code in Profile → Invite Friends\n2. Share via text, email, or social media\n3. When someone signs up with your code, you both get 20 credits\n4. No limit on referrals!\n\nYour referrals help grow the community and earn you rewards. It's a win-win!",
    category: "Account & Features"
  },
  
  // Technical
  {
    id: "faq-19",
    question: "What types of stone can I list?",
    answer: "You can list any natural stone material:\n\n✓ Granite\n✓ Marble  \n✓ Quartzite\n✓ Quartz\n✓ Soapstone\n✓ Limestone\n✓ Travertine\n✓ Slate\n✓ Onyx\n✓ Other natural stones\n\nListings should be for:\n• Full slabs\n• Remnants\n• Offcuts\n• Tiles (in bulk)\n\n✗ No man-made materials\n✗ No single tiles",
    category: "Technical"
  },
  {
    id: "faq-20",
    question: "Why can't I upload more than 7 photos?",
    answer: "The 7-photo limit ensures:\n\n• Fast loading times\n• Focus on quality over quantity\n• Reasonable data usage\n• Consistent user experience\n\nTips for great photos:\n• Use good lighting\n• Show different angles\n• Include close-ups of details\n• Photograph any imperfections\n• Show dimensions with a measuring tape\n\n7 photos is enough to fully showcase any stone piece!",
    category: "Technical"
  }
];

export const categories = [
  "Getting Started",
  "Buying & Selling",
  "Managing Listings",
  "Safety & Trust",
  "Account & Features",
  "Technical"
];
