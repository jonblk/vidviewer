describe('Download video', () => {
  // Open sample library
  before(() => {
    cy.visit(Cypress.env('root_url'));
    cy.get('[data-testid="config-form-toggle"]').click();
    cy.get('#root_folder_path').clear();
    cy.get('#root_folder_path').type(Cypress.env("SAMPLE_LIBRARY_PATH"));
    cy.get('button[type="submit"]').click();
  });

  // Open root url and open playlist
  beforeEach(() => {
    const playlist = 'random';
    cy.visit(Cypress.env('root_url'));
    cy.get(`[data-testid="playlist-${playlist}"]`).click();
  });

  it('has video when playlist clicked', () => {
    // video title
    cy.contains('clouds').should('exist');
    //duration
    cy.contains('0:06').should('exist');
  });
});
