describe('Download video', () => {
  before(() => cy.setRootPath())

  // Open new-video form
  beforeEach(() => {
    cy.visit(Cypress.env('root_url'));
    cy.get('[data-testid="new-video-toggle"]').click();
  });

  it('has a `source` dropdown', () => {
    cy.get('label[for="source"]').should('exist');
    cy.get('[data-testid="dropdown-button-source"]').should('exist');
  });

  it('has `URL` seleted in the source dropdown', () => {
    cy.contains('🔗 URL').should('exist')
  });

  it('has a `URL` input', () => {
    cy.get('label[for="url"]').should('exist');
    cy.get('input[id="url"]').should('exist');
  });

  // NOTE this is failing in cypress only
  // TODO fix
  it.skip('displays `invalid url` when invalid url is typed', ()=> {
    const invalidUrl = 'https://82u32108u12038u.org'
    cy.get('input[id="url"]').type(invalidUrl).trigger('change');
    cy.wait(9000)
    cy.contains('li', 'Invalid url').should('exist');
  })

  it.skip('raises error when trying to download video that was previously downloaded')

  it('fetches resolution options when valid video URL is typed', () => {
    cy.get('input[id="url"]').type('https://archive.org/details/night_of_the_living_dead')
    cy.get('[data-testid="dropdown-button-video_format"]').click()
    cy.wait(10000);
    cy.contains('button', '640x480').should('exist')
    cy.contains('button', '320x240').should('exist')
  }); 

  it('sets resolution when option is clicked', () => {
    cy.get('input[id="url"]').type('https://archive.org/details/night_of_the_living_dead')
    cy.get('[data-testid="dropdown-button-video_format"]').click()
    cy.get('[data-testid="option-video_format-320x240"]').click()
    cy.contains('span', '320x240').should('exist')
  }); 

  it('does not display `All` playlist in playlists dropdown', ()=> {
    cy.get('[data-testid="dropdown-button-playlist"]').click()
    cy.get(`button[data-testid="option-playlist-All"]`).should('not.exist');
  });

  it('displays playlists in the playlists dropdown', () => {
    cy.get('[data-testid="dropdown-button-playlist"]').click()
    for (let playlist of Cypress.env("playlists") as string[]) {
      if (playlist !== "All") {
        cy.contains(
          `button[data-testid="option-playlist-${playlist}"]`, 
          playlist
        ).should('exist');
      }
    }
  });

  // Run all tests here to speed up testing
  it('downloads video when download clicked', () => {
    const videoUrl      = 'https://archive.org/details/SteamboatWillie';
    const playlist      = 'test-download-video';
    const otherPlaylist = 'test-playlist';
    const videoTitle    = 'Steamboat Willie'
    const videoDuration = '7:22'

    // NOTE
    // Wildcard used, but it currently works as this is the only image being loaded 
    cy.intercept('GET', Cypress.env("root_url") + '/images/*').as('getThumbnail');

    // Type videoURL into input
    cy.get('input[id="url"]').type(videoUrl);

    // Wait for resolution options to fetch
    cy.wait(10000);

    // Open playlist options & select playlist
    cy.get('[data-testid="dropdown-button-playlist"]').click();
    cy.get(`button[data-testid="option-playlist-${playlist}"]`).click();

    // Click download
    cy.get('[data-testid="download-video-button"]').click();

    // Check if button is disabled
    cy.get('[data-testid="download-video-button"]').should('be.disabled');

    // Check if UI closed after returning 200 response
    cy.contains('label', 'Source').should('not.exist');

    // Click on the playlist to open videos
    cy.get(`[data-testid="playlist-${playlist}"]`).click()

    // Check that video has not yet been downloaded
    cy.get('body').should('not.contain', videoTitle);

    // Wait for video to download
    cy.wait(20000);

    // Reload
    cy.reload();

    // Click on the playlist to open videos
    cy.get(`[data-testid="playlist-${playlist}"]`).click();

    // Check that video title is correct 
    cy.get('body').should('contain', videoTitle);

    // Check duration 
    cy.get('body').should('contain', videoDuration);

    // Check image
    cy.get(`img[alt="${videoTitle}"]`).should('be.visible');

    // Make sure that other playlists don't have this video
    cy.get(`[data-testid="playlist-${otherPlaylist}"]`).click()
    cy.get('body').should('not.contain', videoTitle);
  })
});