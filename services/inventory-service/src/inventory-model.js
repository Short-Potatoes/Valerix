const inventory = {
  P1: 10,
  P2: 5
};

module.exports = {
  reserve(items) {
    for (const item of items) {
      if (!inventory[item.productId] || inventory[item.productId] < item.qty) {
        return false;
      }
    }
    items.forEach(i => inventory[i.productId] -= i.qty);
    return true;
  },
  getAll() {
    return inventory;
  }
};
