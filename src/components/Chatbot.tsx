const getReply = (msg: string): string => {
  const text = msg.toLowerCase();

  /* LIVE WEBSITE VALUES
     Replace these with your real states / firebase values if available
  */
  const totalProducts = 148;
  const lowStock = 12;
  const outOfStock = 3;

  const todaySales = 32;
  const todayRevenue = 12450;

  const monthlyRevenue = 348900;
  const monthlyOrders = 821;

  const suppliers = 12;
  const customers = 26;

  if (
    match(text, ["hi", "hello", "hey"])
  ) {
    return `👋 Hello! Welcome to ChainAI Assistant.

Your business dashboard is active and updated.

Today:
• Orders: ${todaySales}
• Revenue: ₹${todayRevenue}
• Products: ${totalProducts}

How can I help you today?`;
  }

  if (
    match(text, [
      "stock",
      "inventory"
    ])
  ) {
    return `📦 Inventory Report

Current stock performance from your website:

• Total Products: ${totalProducts}
• Low Stock Items: ${lowStock}
• Out of Stock: ${outOfStock}

Inventory is mostly healthy, but some items need quick restocking.

Recommendation:
Refill fast-selling products first to avoid missed sales.`;
  }

  if (
    match(text, [
      "sales",
      "orders"
    ])
  ) {
    return `📈 Sales Report

Today's business activity:

• Orders Completed: ${todaySales}
• Conversion Rate: Good
• Repeat Buyers: Increasing

Sales flow is stable and customer activity is healthy.

Recommendation:
Highlight top products on homepage for more conversions.`;
  }

  if (
    match(text, [
      "revenue",
      "income"
    ])
  ) {
    return `💰 Revenue Summary

Revenue insights from your website:

• Today: ₹${todayRevenue}
• Monthly: ₹${monthlyRevenue}
• Average Order Value: ₹1,420 approx.

Revenue trend is positive compared to normal days.

Recommendation:
Use combo offers to increase average order value further.`;
  }

  if (
    match(text, [
      "profit",
      "margin"
    ])
  ) {
    return `💵 Profit Overview

Estimated profit performance is stable.

• Best margins from accessories
• Core electronics give strong volume
• Premium products raise profit %

Recommendation:
Promote high-margin accessories during checkout.`;
  }

  if (
    match(text, [
      "reorder",
      "low stock"
    ])
  ) {
    return `⚠️ Reorder Suggestions

Products needing attention:

1. Keyboard
2. USB Cable
3. Mouse
4. Charger
5. Printer Ink

These items may run out soon based on demand.

Recommendation:
Place supplier order today for smooth sales continuity.`;
  }

  if (
    match(text, [
      "top",
      "best",
      "popular"
    ])
  ) {
    return `🏆 Best Selling Products

Based on recent demand:

1. Wireless Mouse
2. Earbuds
3. Fast Charger
4. Keyboard
5. Smart Watch

These products generate consistent interest and repeat purchases.

Recommendation:
Keep these featured on banners and landing pages.`;
  }

  if (
    match(text, [
      "customer",
      "buyers"
    ])
  ) {
    return `👥 Customer Insights

Current website customer activity:

• Active Customers Today: ${customers}
• Returning Users: Growing
• Satisfaction Trend: Positive

Customers trust the platform and continue purchasing.

Recommendation:
Launch loyalty rewards for repeat customers.`;
  }

  if (
    match(text, [
      "supplier",
      "vendor"
    ])
  ) {
    return `🚚 Supplier Status

Supplier network update:

• Active Suppliers: ${suppliers}
• Reliable Vendors: High
• Delayed Shipments: Minimal

Supply chain is operating normally.

Recommendation:
Maintain backup suppliers for top-selling items.`;
  }

  if (
    match(text, [
      "report",
      "analytics"
    ])
  ) {
    return `📊 Business Analytics

Overall website performance:

• Products: ${totalProducts}
• Orders Today: ${todaySales}
• Revenue Today: ₹${todayRevenue}
• Monthly Orders: ${monthlyOrders}

Business trend is positive with stable growth.

Recommendation:
Continue ads for winning products and monitor low stock items.`;
  }

  if (
    match(text, ["today"])
  ) {
    return `📅 Today's Summary

Live business snapshot:

• Orders: ${todaySales}
• Revenue: ₹${todayRevenue}
• Customer Visits: Good
• Product Movement: Active

Today is performing well with steady engagement.`;
  }

  if (
    match(text, [
      "help"
    ])
  ) {
    return `🤖 I can help you with real business insights:

📦 Inventory Status
💰 Revenue Summary
📈 Sales Reports
🏆 Best Products
🚚 Supplier Updates
👥 Customer Insights
📊 Analytics Dashboard

Try asking:
• stock report
• today sales
• revenue
• top products
• supplier status`;
  }

  if (
    match(text, [
      "thanks",
      "thank"
    ])
  ) {
    return `😊 You're welcome!

I'm always ready to help with smart business insights anytime.`;
  }

  return `🤖 I understand your request: "${msg}"

I can provide live-style business insights such as:

• Stock reports
• Revenue summary
• Today's sales
• Top products
• Analytics report

Please try one of those questions.`;
};
