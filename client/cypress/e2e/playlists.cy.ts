describe('Playlists', () => {
  const playlist = 'test-playlist'
  const playlistToDelete = 'test-delete-playlist'

  const createPlaylist = (name: string) => {
    cy.get(`[data-testid=new-playlist-button]`).click()
    cy.get('#playlist-name').clear();
    cy.get('#playlist-name').type(name); 
    cy.get(`[data-testid=create-playlist-button]`).click();
  }

  before(() => cy.setRootPath())

  beforeEach(() => {
    cy.intercept("GET", "/playlists").as("getPlaylists");
    cy.visit(Cypress.env('root_url'));
  });

  it('should call /playlists on App mount', () => {
    cy.wait('@getPlaylists').then((interception) => {
      expect(interception.response?.statusCode).to.eq(200);
    });
  });

  it('should show playlists after loading library', () => {
    cy.contains(playlist).should('exist');
  })

  it('should show `All` playlist', () => {
    cy.contains('All').should('exist');
  })

  // TODO
  it.skip('should not show edit icon when `All` playlist item hovered')
  
  it('should show edit icon when playlist item hovered', () => {
    cy.get(`[data-testid=edit-playlist-button-test-delete]`).should('not.exist');
    cy.contains(playlist).trigger('mouseover');
    cy.get(`[data-testid=edit-playlist-button-${playlist}]`).should('exist');
  });

  it('should open edit playlist form when edit icon clicked', () => {
    cy.contains(playlist).trigger('mouseover')
    cy.get(`[data-testid=edit-playlist-button-${playlist}]`).click()
    cy.contains('label', 'Playlist name').should('exist')
  });

  it('should update playlist name', () => {
    cy.contains(playlist).trigger('mouseover')
    cy.get(`[data-testid=edit-playlist-button-${playlist}]`).click()
    const updatePlaylistName = "new"
    cy.get('#playlist-name').clear();
    cy.get('#playlist-name').type(updatePlaylistName); 
    cy.get(`[data-testid=update-playlist]`).click();
    cy.get(`[data-testid=playlist-${updatePlaylistName}]`).should('exist')
  });

  it('should show warning to delete playlist', () => {
    cy.contains(playlistToDelete).trigger('mouseover')
    cy.get(`[data-testid=edit-playlist-button-${playlistToDelete}]`).click()
    cy.get(`[data-testid=warn-delete-playlist]`).click();
    cy.contains('Delete this playlist?').should('exist')
  });

  it('should go back to edit menu when clicking cancel delete', () => {
    cy.contains(playlistToDelete).trigger('mouseover')
    cy.get(`[data-testid=edit-playlist-button-${playlistToDelete}]`).click()
    cy.get(`[data-testid=warn-delete-playlist]`).click();
    cy.get(`[data-testid=cancel-delete-button]`).click();
    cy.contains('Delete this playlist?').should('not.exist')
    cy.get('#playlist-name').should('exist')
  });

  it('should delete the playlist and remove it from the playlists list', () => {
    cy.contains(playlistToDelete).trigger('mouseover');
    cy.get(`[data-testid=edit-playlist-button-${playlistToDelete}]`).click();
    cy.get(`[data-testid=warn-delete-playlist]`).click();
    cy.get(`[data-testid=delete-playlist-button]`).click();
    cy.get(`[data-testid=playlist-${playlistToDelete}]`).should('not.exist');
    createPlaylist(playlistToDelete);
    cy.get(`[data-testid=playlist-${playlistToDelete}]`).should('exist');
  });

  it('should call /playlists after deleting', () => {
    cy.contains(playlistToDelete).trigger('mouseover')
    cy.get(`[data-testid=edit-playlist-button-${playlistToDelete}]`).click()
    cy.get(`[data-testid=warn-delete-playlist]`).click();

    cy.intercept("GET", "/playlists").as("getPlaylists");
    cy.get(`[data-testid=delete-playlist-button]`).click();

    cy.wait('@getPlaylists').then((interception) => {
      expect(interception.response?.statusCode).to.eq(200);
    });
  })

  it('should add new playlist', () => {
    const name = `new-playlist-${Date.now()}`;
    createPlaylist(name);
    cy.get(`[data-testid=playlist-${name}]`).should('exist');
  });
});