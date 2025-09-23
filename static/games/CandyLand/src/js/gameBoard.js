// Candyland Adventure - Game Board Management

// Helper function to get character PNG for special positions
function getSpecialCharacterAsset(position) {
    // Map positions to character assets
    const characterPositions = {
        30: { name: 'Princess Lolly', asset: 'princess-lolly.png', emoji: '👸' },
        60: { name: 'Queen Frostine', asset: 'queen-frostline.png', emoji: '❄️' },
        90: { name: 'King Candy', asset: 'king-candy.png', emoji: '👑' },
        120: { name: 'Gingerbread Man', asset: 'gingerbread-man.png', emoji: '🍪' }
    };

    return characterPositions[position] || null;
}

// Create the master progress timeline
function createProgressTimeline() {
    const timeline = document.getElementById('progress-timeline');
    if (!timeline) return;

    timeline.innerHTML = '';

    const colors = ['red', 'blue', 'yellow', 'green', 'orange', 'purple'];

    console.log('🏁 Creating master timeline with', gameConfig.TOTAL_SQUARES, 'squares in inverted C shape');

    // Debug: Show the first 12 positions and their colors
    console.log('🔍 Color pattern verification:');
    for (let pos = 0; pos < 12; pos++) {
        const color = colors[pos % colors.length];
        console.log(`Position ${pos}: ${color} (${pos} % 6 = ${pos % colors.length})`);
    }

    // Create segments array to position them in inverted C pattern
    const segments = [];

    for (let i = 0; i < gameConfig.TOTAL_SQUARES; i++) {
        const segment = document.createElement('div');
        segment.className = 'timeline-segment';
        segment.id = `timeline-${i}`;

        // Determine row and position for 3-row layout: right → left → right
        let row, col;

        if (i <= 44) {
            // Row 1: left to right (positions 0-44)
            row = 1;
            col = i + 1;
            segment.className += ' row-1';
        } else if (i <= 89) {
            // Row 2: right to left (positions 45-89)
            row = 2;
            col = 45 - (i - 44); // Reverse direction
            segment.className += ' row-2';
        } else {
            // Row 3: left to right (positions 90-133) - ends with castle
            row = 3;
            col = (i - 89);
            segment.className += ' row-3';
        }

        segment.style.gridColumn = col;
        segment.style.gridRow = row;

        if (i === 0) {
            segment.style.background = 'linear-gradient(45deg, var(--sunshine-yellow), var(--candy-orange))';
            segment.innerHTML = '🏁';
            segment.className += ' milestone';
            console.log('🏁 Timeline position', i, ': START');
        } else if (i === gameConfig.TOTAL_SQUARES - 1) {
            segment.style.background = 'linear-gradient(45deg, var(--hot-pink), var(--purple))';
            segment.innerHTML = '🏰';
            segment.className += ' milestone';
            console.log('🏰 Timeline position', i, ': CASTLE at grid column', col, 'row', row);
        } else {
            const color = colors[i % colors.length];
            // Use the actual color values instead of CSS variables that might not exist
            const colorMap = {
                'red': '#ef4444',
                'blue': '#3b82f6',
                'yellow': '#eab308',
                'green': '#22c55e',
                'orange': '#f97316',
                'purple': '#8b5cf6'
            };
            segment.style.background = colorMap[color];

            // Log specific positions for debugging
            if (i <= 10 || i >= 95 && i <= 105 || i >= 15 && i <= 25 || i === 45 || i === 90 || i >= 130) {
                console.log('🎨 Timeline position', i, 'color:', color, 'row:', row, 'grid column:', col);
            }

            // Mark special squares with character assets
            const specialCharacter = getSpecialCharacterAsset(i);
            if (specialCharacter) {
                // Use PNG asset for special character cards
                segment.innerHTML = `<img src="/static/games/CandyLand/assets/images/cards/${specialCharacter.asset}" alt="${specialCharacter.name}" class="character-asset" onerror="this.style.display='none'; this.nextSibling.style.display='inline';" /><span style="display:none;">${specialCharacter.emoji}</span>`;
                segment.className += ' milestone character-square';
            } else if (gameState.specialSquares.shortcuts[i]) {
                segment.innerHTML = '🌈';
                segment.className += ' milestone';
            } else if (gameState.specialSquares.sticky.includes(i)) {
                segment.innerHTML = '🍯';
            }
        }

        timeline.appendChild(segment);
    }
}

// Create swim lanes for each player
function createSwimLanes() {
    const container = document.getElementById('swim-lanes-container');
    if (!container) {
        console.error('swim-lanes-container not found');
        return;
    }

    console.log('Creating swim lanes for', gameState.players.length, 'players');
    container.innerHTML = '';

    gameState.players.forEach((player, index) => {
        const lane = document.createElement('div');
        lane.className = 'swim-lane';
        lane.id = `lane-${player.id}`;

        if (index === gameState.currentPlayer) {
            lane.className += ' active';
        }

        lane.innerHTML = `
            <div class="lane-header">
                <div class="lane-player-name-bubble">${player.name}'s Turn</div>
            </div>
            <div class="forest-path">
                <div class="walking-character" id="character-${player.id}" ${player.assetPath ? '' : `style="background: ${player.color};"`}>
                    ${player.assetPath ?
                `<img src="${player.assetPath}" alt="${player.name}" class="character-asset" onerror="this.parentElement.style.background='${player.color}'; this.style.display='none'; this.nextSibling.style.display='inline';" /><span style="display:none;">${player.emoji}</span>` :
                player.emoji
            }
                </div>
                <div class="path-tiles" id="tiles-${player.id}">
                    <!-- Next 10 tiles will be generated here -->
                </div>
            </div>
        `;

        container.appendChild(lane);

        // Create the next 5 tiles for this player
        updatePlayerTiles(player);
    });
}

// Update the next 11 tiles for a player - REVERTED TO STATIC TILES
function updatePlayerTiles(player) {
    const tilesContainer = document.getElementById(`tiles-${player.id}`);
    if (!tilesContainer) return;

    tilesContainer.innerHTML = '';

    const colors = ['red', 'blue', 'yellow', 'green', 'orange', 'purple'];
    const colorMap = {
        'red': '#ef4444',
        'blue': '#3b82f6',
        'yellow': '#eab308',
        'green': '#22c55e',
        'orange': '#f97316',
        'purple': '#8b5cf6'
    };

    console.log('🎨 Updating static tiles for', player.name, 'at position', player.position);

    // Show the current tile plus the next 10 tiles (11 total)
    for (let i = 0; i <= 10; i++) {
        const tilePosition = player.position + i;
        if (tilePosition >= gameConfig.TOTAL_SQUARES) break;

        const color = colors[tilePosition % colors.length];
        console.log('🔍 Tile', i, 'position', tilePosition, 'color:', color);

        const tile = document.createElement('div');
        tile.className = 'forest-tile';
        if (i === 0) {
            tile.classList.add('current'); // Mark the current tile
        }
        tile.id = `tile-${player.id}-${tilePosition}`;

        if (tilePosition === 0) {
            tile.innerHTML = '🏁';
            tile.style.background = 'linear-gradient(45deg, var(--sunshine-yellow), var(--candy-orange))';
        } else if (tilePosition === gameConfig.TOTAL_SQUARES - 1) {
            tile.innerHTML = '🏰';
            tile.style.background = 'linear-gradient(45deg, var(--hot-pink), var(--purple))';
        } else {
            tile.style.background = colorMap[color];

            // Add special square indicators with character assets
            const specialCharacter = getSpecialCharacterAsset(tilePosition);
            if (specialCharacter) {
                // Use PNG asset for special character cards
                tile.innerHTML = `<img src="/static/games/CandyLand/assets/images/cards/${specialCharacter.asset}" alt="${specialCharacter.name}" class="character-asset" onerror="this.style.display='none'; this.nextSibling.style.display='inline';" /><span style="display:none;">${specialCharacter.emoji}</span>`;
                tile.className += ' character-tile';
            } else if (gameState.specialSquares.shortcuts[tilePosition]) {
                tile.innerHTML = '🌈';
            } else if (gameState.specialSquares.sticky.includes(tilePosition)) {
                tile.innerHTML = '🍯';
            }
        }

        tilesContainer.appendChild(tile);
    }
}

// Update the old createBoard function to use the new system
function createBoard() {
    console.log('Creating board with', gameState.players.length, 'players');
    createProgressTimeline();
    createSwimLanes();
}

function createSquare(index, colors, colorIndex) {
    const square = document.createElement('div');
    square.className = 'square';
    square.id = `square-${index}`;
    square.style.flex = '1';
    square.style.margin = '1px';
    square.style.minWidth = '40px';  // Minimum 40px as specified in prompt
    square.style.minHeight = '40px';

    // Add touch event listeners for mobile
    addSquareTouchEvents(square);

    if (index === 0) {
        square.className += ' start';
        square.innerHTML = '🏁';
        square.setAttribute('aria-label', 'Start square');
    } else if (index === gameConfig.TOTAL_SQUARES - 1) {
        square.className += ' finish';
        square.innerHTML = '🏰';
        square.setAttribute('aria-label', 'Finish square - Candy Castle');
    } else {
        square.className += ` ${colors[colorIndex % colors.length]}`;

        // Add special square indicators
        if (gameState.specialSquares.sticky.includes(index)) {
            square.className += ' sticky';
            square.innerHTML = '🍯';
            square.setAttribute('aria-label', `Sticky square ${index} - lose a turn`);
        } else if (Object.keys(gameState.specialSquares.shortcuts).includes(index.toString())) {
            square.className += ' special';
            square.innerHTML = '🌈';
            square.setAttribute('aria-label', `Shortcut square ${index}`);
        } else if (Object.keys(gameState.specialSquares.landmarks).includes(index.toString())) {
            square.className += ' special';
            square.innerHTML = '⭐';
            square.setAttribute('aria-label', `Landmark square ${index} - ${gameState.specialSquares.landmarks[index]}`);
        } else {
            square.setAttribute('aria-label', `${colors[colorIndex % colors.length]} square ${index}`);
        }
    }

    // Ensure squares near the end have colors so players can reach the castle
    if (index >= 130 && index < 133) {
        if (!square.classList.contains('sticky') &&
            !square.classList.contains('special') &&
            !square.classList.contains('start') &&
            !square.classList.contains('finish')) {
            // Make sure these squares have a color class
            const colorClasses = ['red', 'blue', 'yellow', 'green', 'orange', 'purple'];
            const hasColor = colorClasses.some(color => square.classList.contains(color));
            if (!hasColor) {
                square.className += ` ${colors[(index - 130) % colors.length]}`;
            }
        }
    }

    return square;
}

function addSquareTouchEvents(square) {
    // Add touch-friendly events for mobile devices
    square.addEventListener('touchstart', function (e) {
        e.preventDefault();
        this.style.transform = 'scale(1.1)';
    }, { passive: false });

    square.addEventListener('touchend', function (e) {
        e.preventDefault();
        this.style.transform = '';
    }, { passive: false });

    // Add click event for debugging/development
    square.addEventListener('click', function () {
        console.log(`Square ${this.id} clicked`);
    });
}

// Place game pieces in their swim lanes
function placeGamePieces() {
    gameState.players.forEach((player, index) => {
        setTimeout(() => {
            initializePlayerInLane(player, index);
        }, index * 200);
    });
}

function initializePlayerInLane(player, index) {
    const character = document.getElementById(`character-${player.id}`);
    if (!character) return;

    // Set initial position
    character.style.opacity = '0';
    character.style.transform = 'scale(0)';

    // Animate entrance
    setTimeout(() => {
        character.style.transition = 'all 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
        character.style.opacity = '1';
        character.style.transform = 'scale(1)';
    }, 100);

    // Initialize player marker on timeline
    createPlayerMarker(player);
}

// Create player marker on the master timeline
function createPlayerMarker(player) {
    const timeline = document.getElementById('progress-timeline');
    if (!timeline) return;

    const marker = document.createElement('div');
    marker.className = 'player-marker';
    marker.id = `marker-${player.id}`;

    // Try to use PNG asset, fallback to emoji with background
    if (player.assetPath) {
        marker.innerHTML = `<img src="${player.assetPath}" alt="${player.name}" class="player-asset" onerror="this.style.background='${player.color}'; this.style.display='flex'; this.innerHTML='${player.emoji}';" />`;
    } else {
        marker.style.background = player.color;
        marker.innerHTML = player.emoji;
    }

    // Position marker at the player's current position
    positionPlayerMarker(player);

    timeline.appendChild(marker);
}

// Position player marker at a specific timeline segment
function positionPlayerMarker(player) {
    const marker = document.getElementById(`marker-${player.id}`);
    const targetSegment = document.getElementById(`timeline-${player.position}`);

    if (!marker || !targetSegment) {
        console.error('❌ Could not find marker or timeline segment for player', player.name);
        return;
    }

    // Add player marker class to the timeline segment
    targetSegment.classList.add(`player-${player.id}-marker`);

    // Position marker relative to the target segment
    const segmentRect = targetSegment.getBoundingClientRect();
    const timelineRect = targetSegment.parentElement.getBoundingClientRect();

    const relativeLeft = segmentRect.left - timelineRect.left + (segmentRect.width / 2) - 15; // Center on segment, adjust for marker width
    const relativeTop = segmentRect.top - timelineRect.top + (segmentRect.height / 2) - 15; // Center vertically on segment

    marker.style.left = relativeLeft + 'px';
    marker.style.top = relativeTop + 'px';
    marker.style.position = 'absolute';
    marker.style.transition = 'all 0.3s ease-in-out'; // Smooth transitions for all positioning

    // Add visual indicator for which row the player is on
    marker.classList.remove('row-1', 'row-2', 'row-3', 'row-4', 'top-row', 'bottom-row'); // Clear previous row classes
    if (player.position <= 44) {
        marker.classList.add('row-1');
    } else if (player.position <= 89) {
        marker.classList.add('row-2');
    } else {
        marker.classList.add('row-3');
    }

    const rowNum = player.position <= 44 ? 1 : player.position <= 89 ? 2 : 3;
    console.log('📍 Positioned', player.name, 'marker at timeline segment', player.position, 'row:', rowNum);
}

// Move a game piece to a specific square
function moveGamePieceToSquare(playerId, targetSquare) {
    const piece = document.getElementById(`piece-${playerId}`);
    const square = document.getElementById(`square-${targetSquare}`);

    if (!piece || !square) return;

    // Remove piece from current parent
    piece.remove();

    // Add to new square
    square.appendChild(piece);

    // Position piece in the center of the square
    piece.style.transform = 'translate3d(0, 0, 0) scale(1)';
    piece.style.left = '50%';
    piece.style.top = '50%';
    piece.style.marginLeft = '-30px'; // Half of piece width
    piece.style.marginTop = '-30px';  // Half of piece height
}

// Animate forest walking movement
function animateMovement(player, targetPosition, onComplete) {
    console.log('🚶 Starting movement animation for', player.name, 'from', player.position, 'to', targetPosition);

    // Handle case where player is already at target position
    if (player.position === targetPosition) {
        console.log('🎯 Player already at target position, calling onComplete immediately');
        if (onComplete) {
            onComplete();
        }
        return;
    }

    const character = document.getElementById(`character-${player.id}`);
    const marker = document.getElementById(`marker-${player.id}`);

    if (!character) {
        console.error('❌ Character element not found:', `character-${player.id}`);
        return;
    }
    if (!marker) {
        console.error('❌ Marker element not found:', `marker-${player.id}`);
        return;
    }

    const currentPos = player.position;
    const totalSteps = targetPosition - currentPos;
    const totalMovementTime = Math.abs(totalSteps) * gameConfig.MOVEMENT_DELAY;

    console.log('🎬 Total movement time:', totalMovementTime + 'ms for', Math.abs(totalSteps), 'steps');

    // Update player position for marker positioning
    const oldPosition = player.position;

    // Add walking animation class for the entire movement duration
    character.classList.add('walking');

    // Animate step by step through the forest
    let currentStep = currentPos;
    let stepCount = 0;

    const walkInterval = setInterval(() => {
        // Handle both forward and backward movement
        const reachedTarget = (totalSteps >= 0 && currentStep >= targetPosition) ||
            (totalSteps < 0 && currentStep <= targetPosition);

        if (reachedTarget) {
            console.log('🎯 Movement animation completed for', player.name, 'at position', currentStep);
            clearInterval(walkInterval);

            // Final position updates
            player.position = targetPosition;

            // Remove old marker classes
            const allSegments = document.querySelectorAll('.timeline-segment');
            allSegments.forEach(segment => segment.classList.remove(`player-${player.id}-marker`));

            // Final position - use the same smooth positioning logic
            const finalSegment = document.getElementById(`timeline-${targetPosition}`);
            if (finalSegment) {
                const segmentRect = finalSegment.getBoundingClientRect();
                const timelineRect = finalSegment.parentElement.getBoundingClientRect();

                const finalLeft = segmentRect.left - timelineRect.left + (segmentRect.width / 2) - 15;
                const finalTop = segmentRect.top - timelineRect.top + (segmentRect.height / 2) - 15;

                marker.style.transition = `all ${gameConfig.MOVEMENT_DELAY}ms ease-in-out`;
                marker.style.left = finalLeft + 'px';
                marker.style.top = finalTop + 'px';

                // Add final marker class
                finalSegment.classList.add(`player-${player.id}-marker`);

                // Update row classes
                marker.classList.remove('row-1', 'row-2', 'row-3');
                if (targetPosition <= 44) {
                    marker.classList.add('row-1');
                } else if (targetPosition <= 89) {
                    marker.classList.add('row-2');
                } else {
                    marker.classList.add('row-3');
                }
            }

            // Update tiles and progress
            updatePlayerTiles(player);
            updatePlayerProgress(player);

            // Remove walking animation after the total movement time plus a small buffer
            setTimeout(() => {
                character.classList.remove('walking');
                console.log('🛑 Walking animation stopped for', player.name);
            }, totalMovementTime + 200); // Extra 200ms buffer to ensure smooth end

            console.log('🔄 Calling onComplete callback for', player.name);
            if (onComplete) {
                onComplete();
            } else {
                console.warn('⚠️ No onComplete callback provided');
            }
            return;
        }

        // Move forward or backward based on direction
        if (totalSteps >= 0) {
            currentStep++;
        } else {
            currentStep--;
        }
        stepCount++;

        // Smoothly animate marker to new position without recalculating from scratch
        const currentSegment = document.getElementById(`timeline-${currentStep}`);
        if (currentSegment) {
            // Get the target position for smooth animation
            const segmentRect = currentSegment.getBoundingClientRect();
            const timelineRect = currentSegment.parentElement.getBoundingClientRect();

            const targetLeft = segmentRect.left - timelineRect.left + (segmentRect.width / 2) - 15;
            const targetTop = segmentRect.top - timelineRect.top + (segmentRect.height / 2) - 15;

            // Smooth transition to new position
            marker.style.transition = `all ${gameConfig.MOVEMENT_DELAY}ms ease-in-out`;
            marker.style.left = targetLeft + 'px';
            marker.style.top = targetTop + 'px';

            // Update row classes for visual styling
            marker.classList.remove('row-1', 'row-2', 'row-3');
            if (currentStep <= 44) {
                marker.classList.add('row-1');
            } else if (currentStep <= 89) {
                marker.classList.add('row-2');
            } else {
                marker.classList.add('row-3');
            }
        }

        // Update tiles to show new next 10
        if (stepCount % 2 === 0) { // Update tiles every other step for smoother animation
            const tempPlayer = { ...player, position: currentStep };
            updatePlayerTiles(tempPlayer);
        }

        // Play walking sound
        playSound('move');

    }, gameConfig.MOVEMENT_DELAY); // 100ms per step as specified
}

// Update player progress display
function updatePlayerProgress(player) {
    const progressEl = document.getElementById(`progress-${player.id}`);
    if (progressEl) {
        const percentage = Math.round((player.position / (gameConfig.TOTAL_SQUARES - 1)) * 100);
        progressEl.textContent = `Position: ${player.position}/${gameConfig.TOTAL_SQUARES - 1} (${percentage}%)`;
    }
}

// Create trail effect for movement
function createTrailEffect(square, color) {
    const trail = document.createElement('div');
    trail.style.position = 'absolute';
    trail.style.width = '20px';
    trail.style.height = '20px';
    trail.style.background = color;
    trail.style.borderRadius = '50%';
    trail.style.opacity = '0.6';
    trail.style.left = square.offsetLeft + 12 + 'px';
    trail.style.top = square.offsetTop + 12 + 'px';
    trail.style.pointerEvents = 'none';
    trail.style.zIndex = '15';
    trail.style.transition = 'all 0.5s ease-out';

    square.parentElement.appendChild(trail);

    setTimeout(() => {
        trail.style.opacity = '0';
        trail.style.transform = 'scale(2)';
        setTimeout(() => trail.remove(), 500);
    }, 100);
}

// Highlight a square (for debugging or special effects)
function highlightSquare(squareIndex, duration = 1000) {
    const square = document.getElementById(`square-${squareIndex}`);
    if (!square) return;

    square.style.boxShadow = '0 0 30px rgba(255, 255, 255, 1)';
    square.style.transform = 'scale(1.2)';

    setTimeout(() => {
        square.style.boxShadow = '';
        square.style.transform = '';
    }, duration);
}

// Get square position for calculations
function getSquarePosition(squareIndex) {
    const square = document.getElementById(`square-${squareIndex}`);
    if (!square) return null;

    const rect = square.getBoundingClientRect();
    return {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
        width: rect.width,
        height: rect.height
    };
}

// Responsive board adjustments
function adjustBoardForScreenSize() {
    const boardPath = document.getElementById('board-path');
    if (!boardPath) return;

    const screenWidth = window.innerWidth;

    if (screenWidth < 480) {
        boardPath.style.padding = '5px';
        document.querySelectorAll('.square').forEach(square => {
            square.style.minWidth = '25px';
            square.style.minHeight = '25px';
        });
    } else if (screenWidth < 768) {
        boardPath.style.padding = '10px';
        document.querySelectorAll('.square').forEach(square => {
            square.style.minWidth = '30px';
            square.style.minHeight = '30px';
        });
    } else {
        boardPath.style.padding = '20px';
        document.querySelectorAll('.square').forEach(square => {
            square.style.minWidth = '40px';
            square.style.minHeight = '40px';
        });
    }
}

// Initialize board event listeners
function initializeBoardEvents() {
    window.addEventListener('resize', adjustBoardForScreenSize);
    window.addEventListener('orientationchange', () => {
        setTimeout(adjustBoardForScreenSize, 100);
    });
}

// Make functions available globally for the game
window.createBoard = createBoard;
window.placeGamePieces = placeGamePieces;
window.moveGamePieceToSquare = moveGamePieceToSquare;
window.animateMovement = animateMovement;
window.createTrailEffect = createTrailEffect;
window.highlightSquare = highlightSquare;
window.getSquarePosition = getSquarePosition;
window.adjustBoardForScreenSize = adjustBoardForScreenSize;
window.initializeBoardEvents = initializeBoardEvents;
window.updatePlayerTiles = updatePlayerTiles;
window.createProgressTimeline = createProgressTimeline;
// Create player score row
function createPlayerScoreRow() {
    const scoreRow = document.getElementById('player-score-row');
    if (!scoreRow) return;

    scoreRow.innerHTML = '';

    gameState.players.forEach((player, index) => {
        const scoreCard = document.createElement('div');
        scoreCard.className = 'player-score-card';
        scoreCard.id = `score-card-${player.id}`;

        const percentage = Math.round((player.position / 133) * 100);

        scoreCard.innerHTML = `
            <div class="player-score-avatar">
                <img src="/static/games/CandyLand/assets/images/players/player${player.id + 1}.png" 
                     alt="${player.name}" 
                     class="character-asset"
                     onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                <div style="display: none; font-size: 1.5rem;">${player.emoji}</div>
            </div>
            <div class="player-score-info">
                <div class="player-score-name">${player.name}</div>
                <div class="player-score-progress">Position ${player.position}/133</div>
                <div class="player-score-percentage">${percentage}%</div>
            </div>
        `;

        scoreRow.appendChild(scoreCard);
    });
}

// Update player score cards
function updatePlayerScoreCards() {
    gameState.players.forEach(player => {
        const scoreCard = document.getElementById(`score-card-${player.id}`);
        if (!scoreCard) return;

        const percentage = Math.round((player.position / 133) * 100);
        const progressText = scoreCard.querySelector('.player-score-progress');
        const percentageText = scoreCard.querySelector('.player-score-percentage');

        if (progressText) progressText.textContent = `Position ${player.position}/133`;
        if (percentageText) percentageText.textContent = `${percentage}%`;

        // Update active player styling
        if (player.id === gameState.currentPlayer) {
            scoreCard.classList.add('active');
        } else {
            scoreCard.classList.remove('active');
        }
    });
}

window.createSwimLanes = createSwimLanes;
window.updatePlayerProgress = updatePlayerProgress;
window.createPlayerMarker = createPlayerMarker;
window.positionPlayerMarker = positionPlayerMarker;
window.createPlayerScoreRow = createPlayerScoreRow;
window.updatePlayerScoreCards = updatePlayerScoreCards;
window.createOverlayWheel = createOverlayWheel;
window.showWheelOverlay = showWheelOverlay;
window.hideWheelOverlay = hideWheelOverlay;
window.spinOverlayWheel = spinOverlayWheel;

// Create overlay wheel with predetermined ending position
function createOverlayWheel(endingCard) {
    const wheelSegments = document.getElementById('wheel-segments');
    if (!wheelSegments) return;

    wheelSegments.innerHTML = '';

    // Create 14 total positions on the wheel
    const wheelPositions = new Array(14);

    // Get available cards for the wheel
    const availableCards = getAvailableWheelCards();
    console.log('🎯 Available cards for wheel:', availableCards);

    // Create a pool of cards to fill all 14 positions
    const cardPool = [...availableCards];

    // If we don't have enough available cards, add some random cards
    while (cardPool.length < 14) {
        // Add random cards from the full deck
        const allCards = [];
        cardTypes.single.forEach(color => {
            allCards.push({ type: 'single', color: color, value: 1 });
        });
        cardTypes.double.forEach(color => {
            allCards.push({ type: 'double', color: color, value: 2 });
        });
        cardTypes.special.forEach(character => {
            allCards.push({ type: 'special', character: character, value: 0 });
        });

        const randomCard = allCards[Math.floor(Math.random() * allCards.length)];
        cardPool.push(randomCard);
    }

    // Shuffle the card pool
    for (let i = cardPool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [cardPool[i], cardPool[j]] = [cardPool[j], cardPool[i]];
    }

    // Fill all 14 positions with cards from the pool
    for (let i = 0; i < 14; i++) {
        wheelPositions[i] = cardPool[i];
    }

    // Find the predetermined card in the wheel and move it to position 0
    const predeterminedIndex = wheelPositions.findIndex(card =>
        card.type === endingCard.type &&
        card.color === endingCard.color &&
        card.character === endingCard.character
    );

    if (predeterminedIndex !== -1) {
        // Swap the predetermined card to position 0
        [wheelPositions[0], wheelPositions[predeterminedIndex]] = [wheelPositions[predeterminedIndex], wheelPositions[0]];
        console.log('🎯 Moved predetermined card to position 0:', endingCard);
    } else {
        // If predetermined card not found, place it at position 0
        wheelPositions[0] = endingCard;
        console.log('🎯 Set predetermined card at position 0:', endingCard);
    }

    // Create conic-gradient for perfect equal segments
    const segmentAngle = 360 / 14; // 25.7 degrees per segment
    let conicGradient = '';

    console.log('🎡 Creating wheel segments:');
    wheelPositions.forEach((card, index) => {
        const startAngle = index * segmentAngle;
        const endAngle = (index + 1) * segmentAngle;

        // All segments have white background
        const color = 'white';

        // Add to conic gradient
        conicGradient += `${color} ${startAngle}deg ${endAngle}deg`;
        if (index < wheelPositions.length - 1) {
            conicGradient += ', ';
        }

        console.log(`  Position ${index}:`, card, `from ${startAngle}deg to ${endAngle}deg`);
        if (index === 0) {
            console.log(`  *** POSITION 0 (STOPPER) ***`);
        }
    });

    // Apply the conic gradient to create perfect equal segments
    wheelSegments.style.background = `conic-gradient(${conicGradient})`;

    // Create text overlays for each segment
    wheelPositions.forEach((card, index) => {
        const textOverlay = document.createElement('div');
        textOverlay.className = 'wheel-segment-text';
        textOverlay.style.position = 'absolute';
        textOverlay.style.width = '100%';
        textOverlay.style.height = '100%';
        textOverlay.style.display = 'flex';
        textOverlay.style.alignItems = 'center';
        textOverlay.style.justifyContent = 'center';
        textOverlay.style.fontSize = '1.2rem';
        textOverlay.style.fontWeight = 'bold';
        textOverlay.style.color = 'white';
        textOverlay.style.textShadow = '2px 2px 4px rgba(0, 0, 0, 0.8)';
        textOverlay.style.pointerEvents = 'none';

        // Position text in the center of each segment
        const segmentAngle = 360 / 14;
        const centerAngle = (index * segmentAngle) + (segmentAngle / 2) - 90; // -90 to align with stopper
        const radius = 35; // Distance from center
        const x = 50 + radius * Math.cos(centerAngle * Math.PI / 180);
        const y = 50 + radius * Math.sin(centerAngle * Math.PI / 180);

        textOverlay.style.left = `${x}%`;
        textOverlay.style.top = `${y}%`;
        textOverlay.style.transform = 'translate(-50%, -50%)';

        // Set content based on card type
        if (card.type === 'special') {
            // Use PNG image for special characters
            const characterMap = {
                'Princess Lolly': 'princess-lolly.png',
                'Queen Frostine': 'queen-frostline.png',
                'King Candy': 'king-candy.png',
                'Gingerbread Man': 'gingerbread-man.png'
            };

            const imageSrc = characterMap[card.character] || 'princess-lolly.png';
            textOverlay.innerHTML = `<img src="/static/games/CandyLand/assets/images/cards/${imageSrc}" alt="${card.character}" style="width: 32px; height: 32px; object-fit: contain;">`;
            textOverlay.style.color = '#8B5CF6'; // Purple for special cards
            console.log(`  Text overlay ${index}: Special card "${card.character}" -> PNG: "${imageSrc}"`);
        } else {
            // Use colored icons for color cards
            const colorMap = {
                'red': '🔴',
                'blue': '🔵',
                'yellow': '🟡',
                'green': '🟢',
                'orange': '🟠',
                'purple': '🟣'
            };
            textOverlay.textContent = colorMap[card.color] || '⚫';
            textOverlay.style.fontSize = '2rem'; // Larger for emoji icons
            console.log(`  Text overlay ${index}: Color card "${card.color}" -> "${textOverlay.textContent}"`);
        }

        // Add data attributes for light-up effect
        textOverlay.setAttribute('data-segment-index', index);
        textOverlay.setAttribute('data-card-type', card.type);
        textOverlay.setAttribute('data-card-value', card.type === 'special' ? card.character : card.color);

        console.log(`  Segment ${index}: ${card.type} card "${card.type === 'special' ? card.character : card.color}" at position ${index}`);

        if (index === 0) {
            console.log(`  *** TEXT OVERLAY AT STOPPER POSITION - This should be the predetermined card ***`);
        }

        // Store card data for later reference
        textOverlay.dataset.cardType = card.type;
        textOverlay.dataset.cardColor = card.color || '';
        textOverlay.dataset.cardCharacter = card.character || '';
        textOverlay.dataset.cardValue = card.value;
        textOverlay.dataset.position = index;

        wheelSegments.appendChild(textOverlay);
    });
}

// Show wheel overlay and spin
function showCardOverlay(endingCard) {
    const overlay = document.getElementById('card-overlay');
    if (!overlay) return;

    overlay.classList.add('show');
    startCardSpinning(endingCard);
}

// Hide card overlay
function hideCardOverlay() {
    const overlay = document.getElementById('card-overlay');
    if (!overlay) return;

    overlay.classList.remove('show');
}

// Start card spinning animation
function startCardSpinning(endingCard) {
    if (gameState.wheelSpinning) return null;

    const spinningCard = document.getElementById('spinning-card');
    const cardIcon = document.getElementById('card-icon');
    const cardText = document.getElementById('card-text');
    const instructions = document.querySelector('.card-instructions');

    if (!spinningCard || !cardIcon || !cardText || !instructions) return null;

    gameState.wheelSpinning = true;
    instructions.textContent = 'Spinning...';

    console.log('🎲 Card spinning:');
    console.log('  - Predetermined card:', endingCard);

    // Get all available cards for cycling
    const availableCards = getAvailableWheelCards();
    const allCards = [...availableCards];

    // Add some random cards if we don't have enough
    while (allCards.length < 20) {
        const randomCard = gameState.wheelDeck[Math.floor(Math.random() * gameState.wheelDeck.length)];
        allCards.push(randomCard);
    }

    // Shuffle the cards for random cycling
    for (let i = allCards.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [allCards[i], allCards[j]] = [allCards[j], allCards[i]];
    }

    // Ensure the ending card is at the end
    allCards.push(endingCard);

    let currentIndex = 0;
    const totalDuration = 3000; // 3 seconds total
    const startTime = Date.now();

    function updateCard() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / totalDuration, 1);

        // Calculate speed - starts fast, slows down
        const maxSpeed = 50; // ms per card at start
        const minSpeed = 200; // ms per card at end
        const speed = maxSpeed + (minSpeed - maxSpeed) * (1 - Math.pow(1 - progress, 3));

        // Update card display
        const currentCard = allCards[currentIndex % allCards.length];

        if (currentCard.type === 'special') {
            const characterMap = {
                'Princess Lolly': 'princess-lolly.png',
                'Queen Frostine': 'queen-frostline.png',
                'King Candy': 'king-candy.png',
                'Gingerbread Man': 'gingerbread-man.png'
            };
            const imageSrc = characterMap[currentCard.character] || 'princess-lolly.png';
            cardIcon.innerHTML = `<img src="/static/games/CandyLand/assets/images/cards/${imageSrc}" alt="${currentCard.character}" style="width: 120px; height: 120px; object-fit: contain;">`;
            cardText.textContent = ''; // No text for special cards
        } else {
            const colorMap = {
                'red': '🔴', 'blue': '🔵', 'yellow': '🟡',
                'green': '🟢', 'orange': '🟠', 'purple': '🟣'
            };
            cardIcon.textContent = colorMap[currentCard.color] || '⚫';
            cardIcon.style.fontSize = '8rem';

            // Only show "2X" for double color cards
            if (currentCard.count > 1) {
                cardText.textContent = '2X';
                cardText.style.color = 'black';
                cardText.style.fontWeight = 'bold';
            } else {
                cardText.textContent = ''; // No text for single color cards
            }
        }

        // Play tick sound for each card change (except the first one)
        if (currentIndex > 0) {
            playSound('tick');
        }

        currentIndex++;

        // Stop when we reach the end
        if (progress >= 1) {
            gameState.wheelSpinning = false;

            // Mark the ending card as used
            markCardAsUsed(endingCard);

            // Update UI with result
            instructions.textContent = getCardText(endingCard);

            // CRITICAL: Update the overlay card to show the EXACT predetermined card
            if (endingCard.type === 'special') {
                const characterMap = {
                    'Princess Lolly': 'princess-lolly.png',
                    'Queen Frostine': 'queen-frostline.png',
                    'King Candy': 'king-candy.png',
                    'Gingerbread Man': 'gingerbread-man.png'
                };
                const imageSrc = characterMap[endingCard.character] || 'princess-lolly.png';
                cardIcon.innerHTML = `<img src="/static/games/CandyLand/assets/images/cards/${imageSrc}" alt="${endingCard.character}" style="width: 120px; height: 120px; object-fit: contain;">`;
                cardText.textContent = ''; // No text for special cards
            } else {
                const colorMap = {
                    'red': '🔴', 'blue': '🔵', 'yellow': '🟡',
                    'green': '🟢', 'orange': '🟠', 'purple': '🟣'
                };
                cardIcon.textContent = colorMap[endingCard.color] || '⚫';
                cardIcon.style.fontSize = '8rem';

                // Only show "2X" for double color cards
                if (endingCard.count > 1) {
                    cardText.textContent = '2X';
                    cardText.style.color = 'black';
                    cardText.style.fontWeight = 'bold';
                } else {
                    cardText.textContent = ''; // No text for single color cards
                }
            }

            // Update main card display
            const drawnCardEl = document.getElementById('drawn-card');
            const mainCardTextEl = document.getElementById('card-text');

            if (drawnCardEl && mainCardTextEl) {
                drawnCardEl.innerHTML = getCardEmoji(endingCard);
                mainCardTextEl.textContent = getCardText(endingCard);
            }

            // Set the drawn card
            gameState.drawnCard = endingCard;

            console.log('🎲 Card spinning completed and landed on:', endingCard);
            console.log('🎲 Final overlay card should match:', endingCard);

            // Hide overlay after a brief delay
            setTimeout(() => {
                hideCardOverlay();

                // Move player after overlay hides
                if (typeof movePlayer === 'function') {
                    movePlayer();
                }
            }, 1500);
        } else {
            // Continue animation with variable speed
            setTimeout(updateCard, speed);
        }
    }

    // Start the animation
    updateCard();

    return endingCard;
}

// Export functions for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        createBoard,
        placeGamePieces,
        moveGamePieceToSquare,
        animateMovement,
        createTrailEffect,
        highlightSquare,
        getSquarePosition,
        adjustBoardForScreenSize,
        initializeBoardEvents,
        updatePlayerTiles,
        createProgressTimeline,
        createSwimLanes,
        updatePlayerProgress,
        createPlayerMarker,
        positionPlayerMarker,
        createPlayerScoreRow,
        updatePlayerScoreCards,
        createOverlayWheel,
        showWheelOverlay,
        hideWheelOverlay,
        spinOverlayWheel
    };
}
