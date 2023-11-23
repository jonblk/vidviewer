const server_port         = Cypress.env("SERVER_PORT")
const empty_library_path  = Cypress.env("EMPTY_LIBRARY_PATH");


// On initial page load when root folder is not found in config settings
// a message should prompt user to enter a `root folder`
// (the location of the video files data). 
describe('Initial page load', () => {
  beforeEach(() => {
    cy.visit(Cypress.env("root_url"));
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
    cy.visit(Cypress.env("root_url"));
    cy.intercept("PUT", "/config").as("submitForm");
  });

  it('displays an error message when invalid root folder path is submitted', () => {
    cy.contains('.text-red-500').should('not.exist');
    cy.get("#root_folder_path").type(' ');
    cy.get('button[type="submit"]').click();
    cy.wait('@submitForm');
    cy.get('.text-red-500').should('be.visible');
  });

  it('closes modal when valid root folder path is submitted', () => {
    cy.get('#root_folder_path').type(empty_library_path);
    cy.get('button[type="submit"]').click();

    cy.wait('@submitForm').then((interception) => {
      expect(interception.response?.statusCode).to.eq(200);
      cy.contains('Root Folder').should('not.exist');
    });
  });

  it('does not display config modal when root path previously set', () => {
    cy.contains('Root Folder').should('not.exist');
  })

  it('opens config modal when user clicks on config icon', () => {
    cy.get("[data-testid=config-form-toggle]").click();
    cy.contains('Root Folder').should('exist');
  })

  it('returns 200 response when valid empty root folder is submitted', () => {
    cy.get('[data-testid="config-form-toggle"]').click();
    cy.get('#root_folder_path').clear();
    cy.get('#root_folder_path').type(empty_library_path);
    cy.get('button[type="submit"]').click();

    cy.wait('@submitForm').then((interception) => {
      expect(interception.response?.statusCode).to.eq(200);
    });
  })

  it('returns 200 response when loading another library', () => {
    cy.get('[data-testid="config-form-toggle"]').click();
    cy.get('#root_folder_path').clear();
    cy.get('#root_folder_path').type(Cypress.env("SAMPLE_LIBRARY_PATH"));
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

  it('updates videos and playlists when updating root folder', () => {
    // Visit sample folder
    cy.setRootPath();  

    cy.get(`[data-testid="video-grid-container"]`).children('div[data-testid]').then(($videos) => {
      const videoCount = $videos.length;
      expect(videoCount).to.be.greaterThan(1)

      cy.setRootPath("EMPTY_LIBRARY_PATH");  
      cy.get(`[data-testid="video-grid-container"]`).then(($el) => {
        const videoCountAfterSwitch = $el.find('div[data-testid]').length
        expect(videoCountAfterSwitch).to.equal(0);
      });
    });
  })
});