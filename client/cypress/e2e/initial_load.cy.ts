const server_port = Cypress.env("SERVER_PORT")
const empty_library_path = Cypress.env("EMPTY_LIBRARY_PATH");
const rootURL = `https://localhost:${server_port}`;

// Tests ConfigForm/Modal functionality
// On initial page load (when root folder is not found in config settings)
// a message should prompt user to enter a `root folder`
// (the location of the video files data). 

describe('Initial page load', () => {
  beforeEach(() => {
    cy.visit(rootURL)
    cy.intercept("PUT", "/config").as("submitForm");
  })

  it('should display `enter root path` config modal when config folder or file not found', () => {
    cy.contains('Root Folder').should('be.visible');
  })

  it('should be impossible to close this modal', () => {
    cy.get('body').type('{esc}')
    cy.contains('Root Folder').should('be.visible');
  })
  
  it("should display an error message when invalid root folder path is submitted", () => {
    cy.get("#root_folder_path").type(" ");
    cy.get('button[type="submit"]').click();
    cy.wait("@submitForm");
    cy.get(".text-red-500").should("be.visible");
  });

  it("should close modal when valid root folder path is submitted", () => {
    cy.get("#root_folder_path").type(empty_library_path);
    cy.get('button[type="submit"]').click();

    cy.wait("@submitForm").then((interception) => {
      expect(interception.response?.statusCode).to.eq(200);
      cy.contains('Root Folder').should('not.exist')
    });
  })
})