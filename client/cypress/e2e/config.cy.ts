const server_port         = Cypress.env("SERVER_PORT")
const empty_library_path  = Cypress.env("EMPTY_LIBRARY_PATH");
const sample_library_path = Cypress.env("SAMPLE_LIBRARY_PATH");
const rootURL             = `https://localhost:${server_port}`;

// Tests ConfigForm/Modal functionality

// On initial page load when root folder is not found in config settings
// a message should prompt user to enter a `root folder`
// (the location of the video files data). 
describe('Initial page load', () => {
  beforeEach(() => {
    cy.visit(rootURL);
    cy.intercept("PUT", "/config").as("submitForm");
  });

  it('should display `enter root path` config modal when config folder or file not found', () => {
    cy.contains('Root Folder').should('be.visible');
  });

  it('should be impossible to close this modal', () => {
    cy.get('body').type('{esc}');
    cy.contains('Root Folder').should('be.visible');
  });
});

// Test that the update root folder functionality is working as intended
describe('Update root folder', () => {
  beforeEach(() => {
    cy.visit(rootURL);
    cy.intercept("PUT", "/config").as("submitForm");
  });

  it('should display an error message when invalid root folder path is submitted', () => {
    cy.contains('.text-red-500').should('not.exist');
    cy.get("#root_folder_path").type(' ');
    cy.get('button[type="submit"]').click();
    cy.wait('@submitForm');
    cy.get('.text-red-500').should('be.visible');
  });

  it('should close modal when valid root folder path is submitted', () => {
    cy.get('#root_folder_path').type(empty_library_path);
    cy.get('button[type="submit"]').click();

    cy.wait('@submitForm').then((interception) => {
      expect(interception.response?.statusCode).to.eq(200);
      cy.contains('Root Folder').should('not.exist');
    });
  });

  it('should not show config modal when root path previously set', () => {
    cy.contains('Root Folder').should('not.exist');
  })

  it('should open config modal when user clicks on config icon', () => {
    cy.get("[data-testid=config-form-toggle]").click();
    cy.contains('Root Folder').should('exist');
  })

  it('should return 200 response when valid empty root folder is submitted', () => {
    cy.get('[data-testid="config-form-toggle"]').click();
    cy.get('#root_folder_path').clear();
    cy.get('#root_folder_path').type(empty_library_path);
    cy.get('button[type="submit"]').click();

    cy.wait('@submitForm').then((interception) => {
      expect(interception.response?.statusCode).to.eq(200);
    });
  })

  it('should return 200 response when loading another library', () => {
    cy.get('[data-testid="config-form-toggle"]').click();
    cy.get('#root_folder_path').clear();
    cy.get('#root_folder_path').type(sample_library_path);
    cy.get('button[type="submit"]').click();

    cy.wait('@submitForm').then((interception) => {
      expect(interception.response?.statusCode).to.eq(200);
    });

    // cleanup, return to previous state
    cy.get('[data-testid="config-form-toggle"]').click();
    cy.get('#root_folder_path').clear();
    cy.get('#root_folder_path').type(empty_library_path);
    cy.get('button[type="submit"]').click();
  })

  it('should show playlists when loading another library', () => {
    cy.contains('playlist1').should('not.exist');
    cy.get('[data-testid="config-form-toggle"]').click();
    cy.get('#root_folder_path').clear();
    cy.get('#root_folder_path').type(sample_library_path);
    cy.get('button[type="submit"]').click();

    cy.wait('@submitForm').then((_) => {
      cy.contains('playlist1').should('exist');
      cy.contains('playlist2').should('exist');
      cy.contains('playlist3').should('exist');
      cy.contains('playlist4').should('exist');
      cy.contains('playlist5').should('exist');
      cy.contains('playlist6').should('exist');
      cy.contains('playlist7').should('exist');
    });
  })
});