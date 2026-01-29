const orders = [];

module.exports = {
  create(order) {
    orders.push(order);
    return order;
  },
  getAll() {
    return orders;
  }
};
