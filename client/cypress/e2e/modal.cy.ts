describe('Modal', () => {
  before(() => cy.setRootPath())

  beforeEach(() => {
    cy.visit(Cypress.env('root_url'));
    cy.get('[data-testid="config-form-toggle"]').click()
  });

 it('opens modal when button clicked', () => {
   cy.get('[data-testid="modal"]').should('be.visible');
 });

 it('closes modal when x button clicked', () => {
   cy.get('[data-testid="modal"]').should('be.visible');
   cy.get('[data-testid="close-modal-button"').click();
   cy.get('[data-testid="modal"]').should('not.exist');
 });

 it('closes modal when esc key pressed', () => {
   cy.get('[data-testid="modal"]').should('be.visible');
   cy.get('body').type('{esc}');
   cy.get('[data-testid="modal"]').should('not.exist');
 });

 it('closes modal when mouse clicked outside of menu', () => {
   cy.get('[data-testid="modal"]').should('be.visible');
   cy.get('[data-testid="modal"]').click('topLeft');
   cy.get('[data-testid="modal"]').should('not.exist');
 });

 it('it is visible and above other elements', () => {
   cy.get('[data-testid="modal"]').should('be.visible');
   cy.get('[data-testid="modal"]').should('have.css', 'z-index', '50');
 });
});
