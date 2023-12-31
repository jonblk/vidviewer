const clickSortBy = (cy: Cypress.cy, option: 'Oldest'|'Latest') => {
  cy.get(`[data-testid="dropdown-button-video-grid-sort-by"]`).click();
  cy.get(`[data-testid="option-video-grid-sort-by-${option}"]`).click();
}

describe('Video grid', () => {
  const totalVideoCount = 33; // the total number of videos in playlist (tests/sample_data db)
  const itemsPerPage = 25; 
  const playlist = 'test-video-grid';  
  const playlistID = '8'
  const title = "32"; // title of video to use in testing
  const getVideosURL = () => `${Cypress.env('root_url')}/playlist/${playlistID}/videos*`

  before(() => cy.setRootPath())

  // Open root url and open playlist
  beforeEach(() => {
    cy.visit(Cypress.env('root_url'));
    cy.get(`[data-testid="playlist-${playlist}"]`).click();
  });

  it('displays 25 items per page when playlist clicked', () => {
    cy.get(`[data-testid="video-grid-container"]`).children('div[data-testid]').should('have.length', itemsPerPage);
  }) 

  it('it displays `play` icon when video item hovered', () => {
    cy.get(`[data-testid=video-item-play-icon]`).should('not.exist');
    cy.get(`[data-testid="video-thumbnail-${title}"]`).trigger('mouseover');
    cy.get(`[data-testid=video-item-play-icon]`).should('exist');
  })

  it('it displays `more` icon when video item hovered', () => {
    cy.get(`[data-testid=video-item-more-icon]`).should('not.exist');
    cy.get(`[data-testid="video-thumbnail-${title}"]`).trigger('mouseover');
    cy.get(`[data-testid=video-item-more-icon]`).should('exist');
  })

  it('opens video when video item clicked', () => {
    cy.get(`[data-testid="video-thumbnail-${title}"]`).trigger('mouseover');
    cy.get(`[data-testid="video-hovered-thumbnail-${title}"]`).click();
    cy.get(`[data-testid="video-title-${title}"]`).should('exist');
  })

  it('opens video edit form when `more` icon clicked', () => {
    cy.get(`[data-testid="modal"]`).should('not.exist');
    cy.get(`[data-testid="video-thumbnail-${title}"]`).trigger('mouseover');
    cy.get(`[data-testid=video-item-more-icon]`).click();
    cy.get(`[data-testid="modal"]`).should('exist');
  })

  it('displays correct videos when using search input', () => {
    cy.get(`[data-testid="video-grid-search"]`).type(title);
    cy.get(`[data-testid="video-grid-container"]`).children('div[data-testid]').should('have.length', 1);
    cy.get(`[data-testid="video-grid-search"]`).clear();
    cy.get(`[data-testid="video-grid-container"]`).children('div[data-testid]').should('have.length', itemsPerPage);
  })

  it('displays newest videos (by upload_date) when `newest` selected', () => {
    clickSortBy(cy, 'Latest');
    let dates: Date[] = [];
    cy.get('h3[data-testid^="download-date"]').each(($el) => {
      const dateText = $el.attr("data-testid")?.split("=")[1];
      if (dateText) {
        const date = new Date(dateText);
        dates.push(date);
      }
    });

    let isDescending = true;
    for (let i = 0; i < dates.length - 1; i++) {
      if (dates[i] < dates[i + 1]) {
        isDescending = false;
        break;
      }
    }

    expect(isDescending).to.be.true
  }); 

  it('displays oldest videos (by upload_date) when `Oldest` selected', () => {
    clickSortBy(cy, 'Oldest');
    let dates: Date[] = [];

    cy.get('h3[data-testid^="download-date"]').each(($el) => {
      const dateText = $el.attr("data-testid")?.split("=")[1];
      if (dateText) {
        const date = new Date(dateText);
        dates.push(date);
      }
    });

    let isAscending = true;
    for (let i = 0; i < dates.length - 1; i++) {
      if (dates[i] > dates[i + 1]) {
        isAscending = false;
        break;
      }
    }

    expect(isAscending).to.be.true
  }); 

  it('fetches more videos when scrolled to bottom of page', () => {
    cy.get(`[data-testid="video-grid-container"]`).children('div[data-testid]').should('have.length', itemsPerPage); 
    cy.scrollTo('bottom');
    cy.get(`[data-testid="video-grid-container"]`).children('div[data-testid]').should('have.length', totalVideoCount);
  }) 

  it('stops fetching videos when all playlist\'s videos have been fetched', () => {
    clickSortBy(cy, 'Oldest');
    const endpoint = getVideosURL();
    cy.intercept("GET", endpoint).as("getVideos");

    cy.get("@getVideos.all").then((interceptions) => {
      expect(interceptions).to.have.length(0);
    });
    cy.scrollTo('bottom');
    cy.wait(1000)
    cy.get("@getVideos.all").then((interceptions) => {
      expect(interceptions).to.have.length(1);
    });
    cy.scrollTo('bottom');
    cy.scrollTo('top');
    cy.scrollTo('bottom');
    cy.wait(1000)
    cy.get("@getVideos.all").then((interceptions) => {
      expect(interceptions).to.have.length(1);
    });
  }) 

  // TODO
  it.skip('loads cached videos and sets scroll position when user clicks back button from current video') 
});
