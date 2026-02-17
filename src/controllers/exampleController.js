class ExampleController {
  static getExample(req, res) {
    res.json({ message: 'Get example' });
  }

  static createExample(req, res) {
    res.status(201).json({ message: 'Example created' });
  }
}

module.exports = ExampleController;
