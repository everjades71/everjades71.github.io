const sampleRoster = {
  forwards: [
    "Macklin Celebrini | C:99, LW:1 | L1:100 | PHOTO: photos/celebrini.jpg",
    "Ty Dellandrea | IN: 98 | C:70, RW:30 | L3:80, L4:20 | PHOTO: photos/dellandrea.jpg",
    "Adam Gaudette | RW:100 | L1:10, L2:5, L3:20, L4:65 | PHOTO: photos/gaudette.jpg",
    "Barclay Goodrow | LW:100 | L1:5, L2:20, L3:15, L4:75 | PHOTO: photos/goodrow.jpg",
    "Collin Graf | IN:90 | RW:90, LW:10 | L1:10, L2:20, L3:40, L4:30 | PHOTO: photos/graf.jpg",
    "Brett Leason | IN: 11 | RW:100 | L3:70, L4:30 | PHOTO: photos/leason.jpg",
    "Filip Bystedt | IN: 11 | C:100 | L3:80, L4:20 | PHOTO: photos/bystedt.jpg",
    "Mason Marchment | LW:90, RW:10 | L1:10, L2:40, L3:40, L4:10 | PHOTO: photos/marchment.jpg",
    "Michael Misa | C:60, LW:40 | L1:10, L2:50, L3:40, L4:10 | PHOTO: photos/misa.jpg",
    "Zack Ostapchuk | IN: 90 | C:100 | L1:5, L2:10, L3:10, L4:80 | PHOTO: photos/ostapchuk.jpg",
    "Will Smith | RW:80, C:20 | L1:70, L2:25, L3:4, L4:1 | PHOTO: photos/smith.jpg",
    "Ivar Stenberg | LW:100 | L1:20, L2:30, L3:40, L4:10 | PHOTO: photos/stenberg.jpg",
    "Tyler Toffoli | LW:50, RW:50 | L1:10, L2:30, L3:40, L4:20 | PHOTO: photos/toffoli.jpg",
    "Alexander Wennberg | C:70, LW:30 | L2:50, L3:40, L4:10 | PHOTO: photos/wennberg.jpg",
  ],
  defense: [
    "Nolan Allan | IN: 35 | PHOTO: photos/allan.jpg",
    "Sam Dickinson | LD:100 | L2:70, L3:30 | PHOTO: photos/dickinson.jpg",
    "Michael Kesselring | IN: 65 | PHOTO: photos/kesselring.jpg",
    "Darnell Nurse | LD:100 | L1:80, L2:10, L3:10 | PHOTO: photos/nurse.jpg",
    "Dmitri Orlov | LD:100 | L1:10, L2:20, L3:70 | PHOTO: photos/orlov.jpg",
    "Eric Pohlkamp | IN: 40 | PHOTO: photos/polkamp.jpg",
    "Luca Cagnoni | IN: 45 | PHOTO: photos/cagnoni.jpg",
    "Libor Hájek | IN: 15 | PHOTO: photos/hajek.jpg",
  ],
  goalies: ["Yaroslav Askarov | IN:60 | PHOTO: photos/askarov.jpg", "Alex Nedeljkovic | IN:40 | PHOTO: photos/nedeljkovic.jpg"],
};
const injuryReserve = [
  { name: "Igor Chernyshov", photo: "photos/chernyshov.jpg" },
  { name: "Kiefer Sherwood", photo: "photos/sherwood.jpg" },
  { name: "Jacob Trouba", photo: "photos/trouba.jpg",}
];

const forwardLines = document.querySelector("#forward-lines");
const supportingLineup = document.querySelector("#supporting-lineup");
const rosterNote = document.querySelector("#roster-note");
const rosterInputs = {
  forwards: document.querySelector("#forwards-input"),
  defense: document.querySelector("#defense-input"),
  goalies: document.querySelector("#goalies-input"),
};
const positions = ["LW", "C", "RW"];
const defensePositions = ["LD", "RD"];

Object.entries(sampleRoster).forEach(([position, players]) => {
  rosterInputs[position].value = players.join("\n");
});

function parseAvailability(text) {
  const match = text.match(/^IN\s*:\s*(\d+(?:\.\d+)?)\s*%?$/i);
  if (!match || Number(match[1]) > 100) return null;
  return Number(match[1]);
}

function parsePlayerMetadata(parts, lineNumber) {
  const preferences = [];
  const errors = [];
  let availability = 100;
  let photo = "";
  let hasAvailability = false;
  let hasPhoto = false;

  parts.forEach((part) => {
    if (/^IN\s*:/i.test(part)) {
      if (hasAvailability) {
        errors.push(`Line ${lineNumber}: specify availability only once.`);
        return;
      }

      availability = parseAvailability(part);
      hasAvailability = true;
      if (availability === null) {
        errors.push(`Line ${lineNumber}: availability must be from 0 to 100, such as IN:70.`);
      }
    } else if (/^PHOTO\s*:/i.test(part)) {
      if (hasPhoto) {
        errors.push(`Line ${lineNumber}: specify a photo only once.`);
        return;
      }

      photo = part.slice(part.indexOf(":") + 1).trim();
      hasPhoto = true;
      if (!photo) errors.push(`Line ${lineNumber}: add a photo path or URL after PHOTO:.`);
    } else {
      preferences.push(part);
    }
  });

  return { preferences, availability, photo, errors };
}

function readForwardRoster(input) {
  const players = [];
  const errors = [];

  input.value.split("\n").forEach((rawLine, index) => {
    const line = rawLine.trim();
    if (!line) return;

    const [playerName, ...metadataParts] = line
      .split("|")
      .map((part) => part.trim());
    if (!playerName) {
      errors.push(`Line ${index + 1}: enter a player name.`);
      return;
    }

    const metadata = parsePlayerMetadata(metadataParts, index + 1);
    errors.push(...metadata.errors);
    if (metadata.errors.length > 0) return;

    if (metadata.preferences.length > 2) {
      errors.push(
        `Line ${index + 1}: use "Name | RW:80, C:20 | L1:70, L2:25 | IN:70 | PHOTO:photos/name.jpg".`,
      );
      return;
    }

    const [positionText, lineText] = metadata.preferences;
    const weights = { LW: 1, C: 1, RW: 1 };
    if (positionText) {
      const seenPositions = new Set();
      positions.forEach((position) => {
        weights[position] = 0;
      });

      const entries = positionText.split(",");
      let valid = entries.length > 0;
      entries.forEach((entry) => {
        const match = entry.trim().match(/^(LW|C|RW)\s*:\s*(\d+(?:\.\d+)?)\s*%?$/i);
        if (!match) {
          valid = false;
          return;
        }

        const position = match[1].toUpperCase();
        if (seenPositions.has(position) || Number(match[2]) > 100) {
          valid = false;
          return;
        }
        seenPositions.add(position);
        weights[position] = Number(match[2]);
      });

      if (!valid || positions.every((position) => weights[position] === 0)) {
        errors.push(`Line ${index + 1}: enter valid LW, C, or RW weights from 0 to 100.`);
        return;
      }
    }

    let lineWeights = null;
    if (lineText !== undefined) {
      if (!lineText) {
        errors.push(`Line ${index + 1}: add at least one line weight, such as L1:70.`);
        return;
      }

      const seenLines = new Set();
      lineWeights = {};
      let valid = true;
      lineText.split(",").forEach((entry) => {
        const match = entry.trim().match(/^L(\d+)\s*:\s*(\d+(?:\.\d+)?)\s*%?$/i);
        if (!match) {
          valid = false;
          return;
        }

        const lineNumber = Number(match[1]);
        const weight = Number(match[2]);
        if (lineNumber < 1 || seenLines.has(lineNumber) || weight > 100) {
          valid = false;
          return;
        }
        seenLines.add(lineNumber);
        lineWeights[lineNumber] = weight;
      });

      if (!valid || Object.values(lineWeights).every((weight) => weight === 0)) {
        errors.push(`Line ${index + 1}: enter valid L1, L2, L3, etc. weights from 0 to 100.`);
        return;
      }
    }

    players.push({
      name: playerName,
      weights,
      lineWeights,
      availability: metadata.availability,
      photo: metadata.photo,
    });
  });

  return { players, errors };
}

function readDefenseRoster(input) {
  const players = [];
  const errors = [];

  input.value.split("\n").forEach((rawLine, index) => {
    const line = rawLine.trim();
    if (!line) return;

    const [name, ...metadataParts] = line
      .split("|")
      .map((part) => part.trim());
    if (!name) {
      errors.push(`Line ${index + 1}: enter a player name.`);
      return;
    }

    const metadata = parsePlayerMetadata(metadataParts, index + 1);
    errors.push(...metadata.errors);
    if (metadata.errors.length > 0) return;
    if (metadata.preferences.length > 2) {
      errors.push(
        `Line ${index + 1}: use "Name | LD:100 | L1:80, L2:10, L3:10" or "Name | LD:80, RD:20".`,
      );
      return;
    }

    const weights = { LD: 1, RD: 1 };
    const positionText = metadata.preferences[0];
    if (positionText && /^(LD|RD)/i.test(positionText)) {
      defensePositions.forEach((position) => {
        weights[position] = 0;
      });

      const entries = positionText.split(",");
      let valid = entries.length > 0;
      const seenPositions = new Set();
      entries.forEach((entry) => {
        const match = entry
          .trim()
          .match(/^(LD|RD)\s*(?:\:\s*(\d+(?:\.\d+)?)\s*%?)?$/i);
        if (!match) {
          valid = false;
          return;
        }

        const position = match[1].toUpperCase();
        const weight = match[2] === undefined ? 100 : Number(match[2]);
        if (seenPositions.has(position) || weight > 100) {
          valid = false;
          return;
        }
        seenPositions.add(position);
        weights[position] = weight;
      });

      if (!valid || defensePositions.every((position) => weights[position] === 0)) {
        errors.push(`Line ${index + 1}: enter valid LD or RD weights from 0 to 100.`);
        return;
      }
    }

    const lineText =
      metadata.preferences.length === 2
        ? metadata.preferences[1]
        : !positionText || /^(LD|RD)/i.test(positionText)
          ? undefined
          : positionText;
    let lineWeights = null;
    if (lineText !== undefined) {
      if (!lineText) {
        errors.push(`Line ${index + 1}: add at least one defense line weight, such as L1:80.`);
        return;
      }

      const seenLines = new Set();
      lineWeights = {};
      let valid = true;
      lineText.split(",").forEach((entry) => {
        const match = entry.trim().match(/^L(\d+)\s*:\s*(\d+(?:\.\d+)?)\s*%?$/i);
        if (!match) {
          valid = false;
          return;
        }

        const lineNumber = Number(match[1]);
        const weight = Number(match[2]);
        if (lineNumber < 1 || lineNumber > 3 || seenLines.has(lineNumber) || weight > 100) {
          valid = false;
          return;
        }
        seenLines.add(lineNumber);
        lineWeights[lineNumber] = weight;
      });

      if (!valid || Object.values(lineWeights).every((weight) => weight === 0)) {
        errors.push(`Line ${index + 1}: enter valid L1, L2, or L3 weights from 0 to 100.`);
        return;
      }
    }

    players.push({
      name,
      weights,
      lineWeights,
      availability: metadata.availability,
      photo: metadata.photo,
    });
  });

  return { players, errors };
}

function readRoster(input) {
  const players = [];
  const errors = [];

  input.value.split("\n").forEach((rawLine, index) => {
    const line = rawLine.trim();
    if (!line) return;

    const [name, ...metadataParts] = line
      .split("|")
      .map((part) => part.trim());
    if (!name) {
      errors.push(`Line ${index + 1}: enter a player name.`);
      return;
    }

    const metadata = parsePlayerMetadata(metadataParts, index + 1);
    errors.push(...metadata.errors);
    if (metadata.errors.length > 0) return;
    if (metadata.preferences.length > 0) {
      errors.push(
        `Line ${index + 1}: use "Name", "Name | IN:70", and/or "Name | IN:70 | PHOTO:photos/name.jpg".`,
      );
      return;
    }

    players.push({ name, availability: metadata.availability, photo: metadata.photo });
  });

  return { players, errors };
}

function selectRoster(players, requiredCount, groupName) {
  const totalProbability = players.reduce((total, player) => total + player.availability / 100, 0);
  if (Math.abs(totalProbability - requiredCount) > 0.000001) {
    return {
      error: `${groupName} availability must total ${requiredCount * 100}%; currently ${(
        totalProbability * 100
      ).toFixed(1)}%.`,
    };
  }

  const candidates = shuffle(players);
  const offset = Math.random();
  let cumulative = 0;
  const selected = [];

  candidates.forEach((player, index) => {
    const before = cumulative;
    cumulative += player.availability / 100;
    if (index === candidates.length - 1) cumulative = requiredCount;
    if (Math.floor(cumulative + offset) > Math.floor(before + offset)) {
      selected.push(player);
    }
  });

  return { players: selected };
}

function shuffle(players) {
  const shuffled = [...players];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled;
}

function chooseWeightedOption(options) {
  const totalWeight = options.reduce((total, option) => total + option.weight, 0);
  let choice = Math.random() * totalWeight;

  for (const option of options) {
    choice -= option.weight;
    if (choice < 0) return option.index;
  }

  return options[options.length - 1].index;
}

function lineWeight(player, lineNumber) {
  return player.lineWeights === null ? 1 : player.lineWeights[lineNumber] || 0;
}

function defenseLineWeight(player, lineNumber) {
  return player.lineWeights === null ? 1 : player.lineWeights[lineNumber] || 0;
}

function canAssignToSlots(players, index, remainingPositions, availableSlots, slots, memo) {
  if (index === players.length) return remainingPositions.every((count) => count === 0);

  const key = `${index}:${remainingPositions.join(",")}:${availableSlots.map(Number).join("")}`;
  if (memo.has(key)) return memo.get(key);

  const player = players[index];
  for (let slotIndex = 0; slotIndex < slots.length; slotIndex += 1) {
    const slot = slots[slotIndex];
    if (
      !availableSlots[slotIndex] ||
      remainingPositions[slot.positionIndex] === 0 ||
      player.weights[slot.position] === 0 ||
      lineWeight(player, slot.lineIndex + 1) === 0
    ) {
      continue;
    }

    const nextRemaining = [...remainingPositions];
    const nextAvailable = [...availableSlots];
    nextRemaining[slot.positionIndex] -= 1;
    nextAvailable[slotIndex] = false;
    if (canAssignToSlots(players, index + 1, nextRemaining, nextAvailable, slots, memo)) {
      memo.set(key, true);
      return true;
    }
  }

  memo.set(key, false);
  return false;
}

function allocateForwards(players) {
  const lineCount = Math.max(4, Math.ceil(players.length / positions.length));
  const shuffled = shuffle(players).sort((first, second) => {
    const countOptions = (player) =>
      positions.reduce(
        (count, position) =>
          count +
          (player.weights[position] > 0
            ? Array.from({ length: lineCount }, (_, index) =>
                lineWeight(player, index + 1),
              ).filter((weight) => weight > 0).length
            : 0),
        0,
      );
    const firstCustom =
      Number(first.lineWeights !== null) +
      Number(positions.some((position) => first.weights[position] !== 1));
    const secondCustom =
      Number(second.lineWeights !== null) +
      Number(positions.some((position) => second.weights[position] !== 1));
    return countOptions(first) - countOptions(second) || secondCustom - firstCustom;
  });
  const baseCount = Math.floor(shuffled.length / positions.length);
  const extraCount = shuffled.length % positions.length;
  const capacityOptions = [];
  const slots = Array.from({ length: lineCount }, (_, lineIndex) =>
    positions.map((position, positionIndex) => ({ position, positionIndex, lineIndex })),
  ).flat();

  for (let mask = 0; mask < 1 << positions.length; mask += 1) {
    const selected = positions.map((_, index) => (mask >> index) & 1);
    if (selected.reduce((sum, bit) => sum + bit, 0) !== extraCount) continue;
    capacityOptions.push(selected.map((bit) => baseCount + bit));
  }

  const feasibleCapacities = capacityOptions.filter((capacities) =>
    canAssignToSlots(
      shuffled,
      0,
      capacities,
      Array(slots.length).fill(true),
      slots,
      new Map(),
    ),
  );
  if (feasibleCapacities.length === 0) return null;

  const remaining = [...feasibleCapacities[Math.floor(Math.random() * feasibleCapacities.length)]];
  const availableSlots = Array(slots.length).fill(true);
  const assigned = Array.from({ length: lineCount }, () => Array(positions.length).fill(null));

  shuffled.forEach((player, index) => {
    const options = slots
      .map((slot, slotIndex) => ({ slot, slotIndex }))
      .filter(({ slot, slotIndex }) => {
        if (!availableSlots[slotIndex] || remaining[slot.positionIndex] === 0) return false;
        if (player.weights[slot.position] === 0 || lineWeight(player, slot.lineIndex + 1) === 0) {
          return false;
        }

        const nextRemaining = [...remaining];
        const nextAvailable = [...availableSlots];
        nextRemaining[slot.positionIndex] -= 1;
        nextAvailable[slotIndex] = false;
        return canAssignToSlots(
          shuffled,
          index + 1,
          nextRemaining,
          nextAvailable,
          slots,
          new Map(),
        );
      })
      .map(({ slot, slotIndex }) => ({
        index: slotIndex,
        weight: player.weights[slot.position] * lineWeight(player, slot.lineIndex + 1),
      }));

    const slotIndex = chooseWeightedOption(options);
    const slot = slots[slotIndex];
    remaining[slot.positionIndex] -= 1;
    availableSlots[slotIndex] = false;
    assigned[slot.lineIndex][slot.positionIndex] = player;
  });

  return { assigned, lineCount };
}

function allocateDefense(players) {
  const slots = Array.from({ length: 3 }, (_, lineIndex) =>
    defensePositions.map((position, positionIndex) => ({
      position,
      positionIndex,
      lineIndex,
    })),
  ).flat();
  const shuffled = shuffle(players).sort((first, second) => {
    const firstCustom = defensePositions.some(
      (position) => first.weights[position] !== 1,
    ) || first.lineWeights !== null;
    const secondCustom = defensePositions.some(
      (position) => second.weights[position] !== 1,
    ) || second.lineWeights !== null;
    return Number(firstCustom) - Number(secondCustom);
  });
  const assigned = Array.from({ length: 3 }, () => Array(2).fill(null));

  function canAssign(index, remaining, availableSlots) {
    if (index === shuffled.length) return remaining.every((count) => count === 0);

    const player = shuffled[index];
    for (let slotIndex = 0; slotIndex < slots.length; slotIndex += 1) {
      const slot = slots[slotIndex];
      if (
        !availableSlots[slotIndex] ||
        remaining[slot.positionIndex] === 0 ||
        player.weights[slot.position] === 0 ||
        defenseLineWeight(player, slot.lineIndex + 1) === 0
      ) {
        continue;
      }

      const nextRemaining = [...remaining];
      const nextAvailable = [...availableSlots];
      nextRemaining[slot.positionIndex] -= 1;
      nextAvailable[slotIndex] = false;
      if (canAssign(index + 1, nextRemaining, nextAvailable)) return true;
    }
    return false;
  }

  if (!canAssign(0, [3, 3], Array(slots.length).fill(true))) return null;

  const remaining = [3, 3];
  const availableSlots = Array(slots.length).fill(true);
  shuffled.forEach((player, index) => {
    const options = slots
      .map((slot, slotIndex) => ({ slot, slotIndex }))
      .filter(({ slot, slotIndex }) => {
        if (!availableSlots[slotIndex] || remaining[slot.positionIndex] === 0) return false;
        if (
          player.weights[slot.position] === 0 ||
          defenseLineWeight(player, slot.lineIndex + 1) === 0
        ) {
          return false;
        }

        const nextRemaining = [...remaining];
        const nextAvailable = [...availableSlots];
        nextRemaining[slot.positionIndex] -= 1;
        nextAvailable[slotIndex] = false;
        return canAssign(index + 1, nextRemaining, nextAvailable);
      })
      .map(({ slot, slotIndex }) => ({
        index: slotIndex,
        weight:
          player.weights[slot.position] *
          defenseLineWeight(player, slot.lineIndex + 1),
      }));

    if (options.length === 0) return;
    const slotIndex = chooseWeightedOption(options);
    const slot = slots[slotIndex];
    remaining[slot.positionIndex] -= 1;
    availableSlots[slotIndex] = false;
    assigned[slot.lineIndex][slot.positionIndex] = player;
  });

  return assigned;
}

function makePhotoPlaceholder(name) {
  const placeholder = document.createElement("span");
  placeholder.className = "player-photo-placeholder";
  placeholder.setAttribute("aria-hidden", "true");
  placeholder.textContent = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] || "")
    .join("")
    .toUpperCase();
  return placeholder;
}

function isAllowedPhotoSource(source) {
  const hasProtocol = /^[a-z][a-z\d+.-]*:/i.test(source);
  return !hasProtocol || /^(https?:\/\/|file:\/\/)/i.test(source);
}

function makePlayerDisplay(player, variant = "") {
  const display = document.createElement("div");
  display.className = `player-display ${variant}`.trim();

  if (player.photo && isAllowedPhotoSource(player.photo)) {
    const image = document.createElement("img");
    image.className = "player-photo";
    image.alt = `${player.name} photo`;
    image.loading = "lazy";
    image.referrerPolicy = "no-referrer";
    image.addEventListener(
      "error",
      () => image.replaceWith(makePhotoPlaceholder(player.name)),
      { once: true },
    );
    display.append(image);
    image.src = player.photo;
  } else {
    display.append(makePhotoPlaceholder(player.name));
  }

  const name = document.createElement("span");
  name.className = "player-name";
  name.textContent = player.name;
  display.append(name);
  return display;
}

function makeCard(title, players, extraClass = "") {
  const card = document.createElement("article");
  card.className = `line-card ${extraClass}`.trim();

  const heading = document.createElement("h3");
  heading.textContent = title;
  card.append(heading);

  const list = document.createElement("ul");
  if (players.length === 0) {
    const empty = document.createElement("li");
    empty.className = "empty-state";
    empty.textContent = "No players added";
    list.append(empty);
  } else {
    players.forEach((player) => {
      const item = document.createElement("li");
      item.append(makePlayerDisplay(player, "supporting-player"));
      list.append(item);
    });
  }

  card.append(list);
  return card;
}

function makeDefenseCard(lineNumber, leftDefense, rightDefense) {
  const card = document.createElement("article");
  card.className = "line-card defense-card";

  const heading = document.createElement("h3");
  heading.textContent = `Defense pair ${lineNumber}`;
  card.append(heading);

  const list = document.createElement("ul");
  [
    ["LD", leftDefense],
    ["RD", rightDefense],
  ].forEach(([position, player]) => {
    const item = document.createElement("li");
    if (player) {
      item.dataset.position = position;
      item.append(makePlayerDisplay(player, "supporting-player"));
    } else {
      item.className = "empty-state";
      item.textContent = `${position} —`;
    }
    list.append(item);
  });

  card.append(list);
  return card;
}

function makeForwardRow(lineNumber, players) {
  const row = document.createElement("div");
  row.className = "forward-row";

  const lineLabel = document.createElement("span");
  lineLabel.className = "line-number";
  lineLabel.textContent = `Line ${lineNumber}`;
  row.append(lineLabel);

  ["LW", "C", "RW"].forEach((position, index) => {
    const slot = document.createElement("div");
    slot.className = "forward-player";
    slot.dataset.position = position;
    if (players[index]) {
      slot.append(makePlayerDisplay(players[index]));
    } else {
      slot.classList.add("empty-state");
      slot.textContent = "—";
    }
    row.append(slot);
  });

  return row;
}

function renderLineup() {
  const parsedForwards = readForwardRoster(rosterInputs.forwards);
  const parsedDefense = readDefenseRoster(rosterInputs.defense);
  const parsedGoalies = readRoster(rosterInputs.goalies);
  const forwardRows = [];
  const supportingCards = [];
  const parseErrors = [
    ...parsedForwards.errors,
    ...parsedDefense.errors.map((error) => `Defense: ${error}`),
    ...parsedGoalies.errors.map((error) => `Goalies: ${error}`),
  ];

  if (parseErrors.length > 0) {
    rosterNote.classList.add("error");
    rosterNote.textContent = parseErrors.join(" ");
    return;
  }

  const selectedForwards = selectRoster(parsedForwards.players, 12, "Forwards");
  const selectedDefense = selectRoster(parsedDefense.players, 6, "Defense");
  const selectedGoalies = selectRoster(parsedGoalies.players, 1, "Goalies");
  const selectionError =
    selectedForwards.error || selectedDefense.error || selectedGoalies.error;
  if (selectionError) {
    rosterNote.classList.add("error");
    rosterNote.textContent = selectionError;
    return;
  }

  const goalies = shuffle(selectedGoalies.players);
  const forwardAllocation = allocateForwards(selectedForwards.players);
  if (!forwardAllocation) {
    rosterNote.classList.add("error");
    rosterNote.textContent =
      "These position and line weights cannot fill balanced lines. Adjust the player preferences and try again.";
    return;
  }
  const defenseAllocation = allocateDefense(selectedDefense.players);
  if (!defenseAllocation) {
    rosterNote.classList.add("error");
    rosterNote.textContent =
      "These defense position weights cannot fill three LD and three RD spots. Adjust the player preferences and try again.";
    return;
  }

  for (let index = 0; index < forwardAllocation.lineCount; index += 1) {
    const line = forwardAllocation.assigned[index];
    forwardRows.push(makeForwardRow(index + 1, line));
  }

  for (let index = 0; index < defenseAllocation.length; index += 1) {
    supportingCards.push(makeDefenseCard(index + 1, ...defenseAllocation[index]));
  }

  supportingCards.push(makeCard("Starter", goalies.slice(0, 1), "goalie-card"));
  supportingCards.push(
    makeCard("Injury Reserve", injuryReserve, "injury-reserve-card"),
  );

  forwardLines.replaceChildren(...forwardRows);
  supportingLineup.replaceChildren(...supportingCards);
  rosterNote.classList.remove("error");
  rosterNote.textContent =
    `${selectedForwards.players.length} forwards selected · ${selectedDefense.players.length} defense · ${selectedGoalies.players.length} goalies`;
}

document.querySelector("#shuffle-button").addEventListener("click", renderLineup);
renderLineup();
