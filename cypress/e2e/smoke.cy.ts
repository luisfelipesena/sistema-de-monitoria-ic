describe('Smoke Test', () => {
  it('should load the home page', () => {
    cy.visit('/');
    cy.contains('Vite'); // Assuming your default Vite app might contain this, adjust if necessary
  });
}); 