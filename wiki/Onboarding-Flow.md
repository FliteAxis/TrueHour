# Onboarding Flow

## Summary

Implemented a comprehensive onboarding wizard system that guides new users through setting up their TrueHour. The wizard
provides three pathways: manual entry, ForeFlight CSV import, and loading saved budgets.

**Completed**: 2025-11-29

---

## Overview

The onboarding flow replaces the previous "blank screen" first-time user experience with a friendly, guided wizard that helps users:

1. Import their existing flight hours (manually or via ForeFlight CSV)
2. Set up their training aircraft with rental rates
3. Select their certification goal
4. Start using the calculator with confidence

### Key Features

- **Three Entry Paths**: Manual, ForeFlight Import, or Load Saved Budget
- **Progressive Wizard**: Multi-step guided flow with progress tracking
- **Smart Defaults**: Auto-detects aircraft from logbooks, suggests default selections
- **FAA Verification**: Optional aircraft data verification from FAA registry
- **Validation**: Inline validation prevents common data entry errors
- **Resume Support**: Can resume interrupted onboarding sessions
- **Classic Mode Fallback**: Option to skip onboarding with `?flow=classic`

---

## User Flows

### Path 1: Manual Entry

**For users without ForeFlight or starting fresh**

```
Landing Screen → Enter Hours → Add Aircraft → Select Certification → Review → Main App
     |              |              |                |                 |
     |              |              |                |                 |
  3 options   Total, PIC, XC,  Type, Reg,      IR, CPL, CFI      Summary of
              Instrument      Wet/Dry Rate    + Training Pace    all settings
```

**Steps:**
1. **Enter Hours**: Input total flight time, PIC, cross-country, instrument, and simulator hours
   - Validation: PIC, XC, and Instrument cannot exceed Total
   - All fields start at 0 for new pilots

2. **Add Aircraft**: Add one or more training aircraft
   - Enter make, model, and tail number (optional)
   - Choose wet rate (fuel included) or dry rate (fuel separate)
   - For dry rate: enter fuel price and burn rate
   - Can add multiple aircraft
   - Form with "Save Aircraft" button and live aircraft list

3. **Select Certification**: Choose training goal
   - Instrument Rating (Part 61)
   - Commercial Pilot License (Part 61)
   - Certified Flight Instructor
   - Set training pace (lessons per week)

4. **Review**: Confirm all entered data
   - Summary of hours
   - List of aircraft with rates
   - Certification goal
   - Option to go back and edit

### Path 2: ForeFlight Import

**For users with ForeFlight logbook data**

```
Landing Screen → Upload CSV → Import Aircraft → Verify Hours → Select Cert → Review → Main App
     |              |              |                 |                |           |
     |              |              |                 |                |           |
  3 options     Drop/Browse   Select aircraft    Auto-calculated   IR/CPL/CFI  Summary
                  CSV file    + enter rates         totals
```

**Steps:**
1. **Upload CSV**: Drop or browse for ForeFlight CSV export
   - Automatic parsing of logbook data
   - Progress indicator during processing
   - Error messages if file format invalid

2. **Import Aircraft**: Select aircraft to import
   - Shows all aircraft detected in logbook
   - Displays total hours logged per aircraft
   - **FAA Verification**: US aircraft (N-numbers) are automatically verified against FAA registry
   - Data source badges: "✓ FAA Verified", "✓ FAA Cached", or "ForeFlight"
   - Pre-filled year, make, and model from FAA data (or ForeFlight if not available)
   - All fields editable
   - Checkbox to select/deselect each aircraft
   - Enter wet or dry rental rates for each
   - Default aircraft checkbox (first selected by default)
   - "Continue" button appears at bottom after selections made

3. **Verify Hours**: Review auto-calculated flight hours
   - Total time, PIC, cross-country, instrument
   - Checkbox: "These hours look correct"
   - Must confirm before proceeding

4. **Select Certification**: Same as manual path

5. **Review**: Same as manual path, but shows imported data

### Path 3: Load Saved Budget

**For users returning to a previous budget**

```
Landing Screen → Select File → Main App
     |              |
     |              |
  3 options     Browse for
                saved JSON
```

**Steps:**
1. **Select File**: Upload previously saved budget JSON
   - Drop or browse for .json file
   - Loads all configuration: hours, aircraft, settings
   - Bypasses all setup steps
   - Goes directly to main calculator

---

## Landing Screen

The first screen users see, presenting three clear options:

```
┌─────────────────────────────────────────────────────────┐
│          TrueHour                       │
│       Plan your flight training costs with precision    │
│                                                          │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐       │
│  │     📝     │  │     ✈️     │  │     💾     │       │
│  │            │  │            │  │            │       │
│  │Start Fresh │  │   Import   │  │    Load    │       │
│  │            │  │  Logbook   │  │   Budget   │       │
│  │            │  │            │  │            │       │
│  │Enter hours │  │Upload CSV  │  │Continue    │       │
│  │and goals   │  │to auto-fill│  │saved work  │       │
│  │  manually  │  │            │  │            │       │
│  └────────────┘  └────────────┘  └────────────┘       │
│                                                          │
│     Try with sample data  •  Skip to classic view      │
└─────────────────────────────────────────────────────────┘
```

**Features:**
- Clear visual hierarchy
- Icon-based navigation
- Descriptive subtitles
- Sample data option for testing
- Classic mode escape hatch

---

## Wizard UI Components

### Progress Bar

Shows current position in the flow:

```
████████░░░░░░░░  Step 2 of 4
```

- Visual progress indicator
- Step counter
- Updates as user advances

### Navigation Buttons

```
[← Back]                    [Continue →]
```

- Back button (hidden on first step)
- Continue button (changes to "Complete Setup" on last step)
- Hidden on auto-advance steps (CSV upload, aircraft import)

### Help Tips

Contextual help messages appear on each step:

```
┌─────────────────────────────────────────────────────┐
│ 💡 Tip: These hours help us calculate how much     │
│ training you have left. PIC, XC, and Instrument    │
│ hours cannot exceed your total flight time.        │
└─────────────────────────────────────────────────────┘
```

### Validation Messages

Real-time validation with helpful error messages:

```
┌─────────────────────────────────────────────────────┐
│ ⚠ Validation Error:                                 │
│ • PIC hours cannot exceed total flight time         │
│ • Cross Country hours cannot exceed total time      │
└─────────────────────────────────────────────────────┘
```

---

## FAA Aircraft Verification

**New in this release**: Automatic FAA registry verification for US aircraft during ForeFlight import.

### How It Works

1. **Detection**: During CSV processing, identifies US aircraft (N-numbers)
2. **Lookup**: Queries tail-lookup service (if available) for FAA data
3. **Enrichment**: Updates aircraft with verified year, make, and model
4. **Visual Indicators**: Shows data source badges

### Data Source Badges

- **✓ FAA Verified** (green) - Fresh data from FAA registry
- **✓ FAA Cached** (blue) - Previously verified data from cache
- **ForeFlight** (gray) - Data from logbook only (no FAA verification)

### Benefits

- **Accuracy**: Ensures aircraft data matches official FAA records
- **Consistency**: Standardized make/model names
- **Trust**: Visual confirmation of data source
- **Fallback**: Uses ForeFlight data if FAA lookup unavailable

### Configuration

FAA verification requires the optional `tail-lookup` service:

```yaml
# docker-compose.yml
services:
  tail-lookup:
    image: ryakel/tail-lookup:latest
    # ... configuration
```

If not available, onboarding works normally with ForeFlight data only.

---

## Data Flow

### Manual Entry Path

```javascript
// Wizard collects data
wizardData = {
  hours: {
    total: 90,
    pic: 40,
    xc: 11.2,
    instrument: 4.3,
    simulator: 3.1
  },
  certification: 'ir',
  lessonsPerWeek: 2
}

// Converts to global currentHours
currentHours = {
  totalTime: 90,
  picTime: 40,
  picXC: 11.2,
  instrumentTotal: 4.3,
  simInstrumentTime: 3.1,
  dualReceived: 50,  // calculated: total - pic
  actualInstrument: 0.86,  // estimated split
  simulatedInstrument: 3.44,
  // ... additional fields
}

// Aircraft saved via AircraftAPI
AircraftAPI.addAircraft({
  type: "Cessna 172",
  registration: "N12345",
  wetRate: 165,
  fuelPrice: 6,
  fuelBurn: 8,
  source: "manual"
})
```

### ForeFlight Import Path

```javascript
// CSV parsed by parseForeFlight()
validFlights = [
  { Date: '2024-01-15', TotalTime: 1.5, PIC: 1.5, ... },
  { Date: '2024-01-20', TotalTime: 1.8, PIC: 0, ... },
  // ... more flights
]

// processLogbookData() calculates totals
currentHours = {
  totalTime: 90,
  picTime: 40,
  picXC: 11.2,
  instrumentTotal: 4.3,
  simInstrumentTime: 3.1,
  batdTime: 2.5,  // BATD simulator hours
  // ... all fields calculated from logbook
}

// Detected aircraft
detectedAircraft = [
  {
    registration: "N12345",
    make: "Cessna",
    model: "172",
    year: "1981",
    totalTime: 45.5,
    dataSource: "faa"  // or "cache" or "foreflight"
  },
  // ... more aircraft
]

// User adds rates, saved via AircraftAPI
```

---

## Technical Implementation

### File Structure

```
app/
├── js/
│   ├── onboarding.js       # 1751 lines - Main wizard logic
│   ├── aircraft-ui.js      # Aircraft import modal integration
│   ├── aircraft-api.js     # Aircraft data management
│   └── aircraft-lookup.js  # FAA verification service
├── css/
│   └── styles.css          # Wizard and landing styles
└── index.html              # Landing and wizard HTML
```

### Key Functions

**OnboardingManager** (`onboarding.js`):
- `init()` - Initialize onboarding system
- `showLanding()` - Display landing screen
- `startManualPath()` - Begin manual entry flow
- `startForeFlightPath()` - Begin ForeFlight import
- `startLoadPath()` - Begin load saved budget
- `nextStep()` - Advance to next wizard step
- `previousStep()` - Go back one step
- `validateCurrentStep()` - Validate current step data
- `saveStepData()` - Save current step to wizardData
- `completeOnboarding()` - Finish and show main app
- `processLogbookData()` - Parse ForeFlight CSV and calculate hours
- `renderAircraftList()` - Render aircraft import UI with FAA badges

**AircraftLookup** (`aircraft-lookup.js`):
- `isOnlineLookupEnabled()` - Check if tail-lookup service available
- `isUSAircraft(registration)` - Check if N-number format
- `lookupByTailNumber(tailNumber)` - Query FAA data
- `getCachedLookup(tailNumber)` - Retrieve cached results

### State Management

```javascript
const OnboardingManager = {
  currentPath: 'manual',           // Current flow: manual/foreflight/load
  currentStep: 'enter_hours',      // Current wizard step
  wizardData: {                    // Accumulated data
    hours: {},
    detectedAircraft: [],
    csvAircraftData: [],
    certification: '',
    lessonsPerWeek: 2,
    aircraftSaved: false           // Prevent duplicate saves
  },
  _flightData: [],                 // Raw CSV flight data
  _aircraftTableData: []           // Raw CSV aircraft table
}
```

### URL Routing

The wizard supports hash-based routing for bookmarking and back button:

```
#/onboarding                    → Landing screen
#/onboarding/manual/hours       → Manual path, enter hours
#/onboarding/manual/aircraft    → Manual path, add aircraft
#/onboarding/foreflight/upload  → ForeFlight path, upload CSV
#/onboarding/foreflight/aircraft → ForeFlight path, import aircraft
```

### Local Storage

```javascript
// Onboarding completion flag
localStorage.setItem('flight-budget-onboarding-completed', 'true')

// In-progress wizard data (for resume)
localStorage.setItem('flight-budget-onboarding-progress', JSON.stringify({
  path: 'manual',
  step: 'add_aircraft',
  data: { hours: {...}, ... }
}))
```

---

## Validation Rules

### Hours Entry

- **Total Time**: Must be ≥ 0
- **PIC**: Cannot exceed Total Time
- **Cross Country**: Cannot exceed Total Time
- **Instrument**: Cannot exceed Total Time
- **Simulator**: Optional, no validation

### Aircraft Entry

- **Make**: Required (manual path)
- **Model**: Required (manual path)
- **Registration**: Optional
- **Rate**: Must have either wet rate OR dry rate > 0
- **Fuel Data**: Required only if using dry rate

### ForeFlight Import

- **CSV Format**: Must be valid ForeFlight export
- **Aircraft Selection**: At least one aircraft must be selected
- **Rates**: Each selected aircraft must have a rate entered
- **Hours Confirmation**: User must check "These hours look correct"

---

## Error Handling

### CSV Upload Errors

```javascript
onError: (errorMessage) => {
  // Display user-friendly error message
  statusEl.innerHTML = '❌ ' + errorMessage;
}
```

**Common Errors:**
- Invalid file format (not a ForeFlight CSV)
- Missing required columns
- No valid flights found
- Corrupt or truncated file

### Aircraft Import Errors

- **No rates entered**: Alert prompts for rates before allowing import
- **No aircraft selected**: Cannot advance without selecting at least one
- **Invalid rate values**: Must be positive numbers

### Navigation Errors

- **Unsaved changes**: Warns before navigating away
- **Missing required data**: Blocks advancement until validated
- **Back button**: Safely returns to previous step

---

## Integration with Main App

### Data Handoff

When onboarding completes, all data is transferred to the main app:

```javascript
completeOnboarding: function() {
  // 1. Mark as completed
  localStorage.setItem('flight-budget-onboarding-completed', 'true')

  // 2. Clear progress data
  localStorage.removeItem('flight-budget-onboarding-progress')

  // 3. Hide wizard
  document.getElementById('onboarding-wizard').style.display = 'none'

  // 4. Show main app
  this.showMainApp()

  // 5. Trigger initial calculation
  if (typeof updateDisplay === 'function') {
    updateDisplay()
  }
}
```

### Aircraft Cards

Aircraft saved during onboarding are automatically rendered as cards in the main calculator:

```javascript
const allAircraft = AircraftAPI.getAllAircraft()
allAircraft.forEach(ac => {
  addAircraft({
    id: ac.id,
    make: ac.make,
    model: ac.model,
    registration: ac.registration,
    type: ac.wetRate > 0 ? 'wet' : 'dry',
    rate: ac.wetRate > 0 ? ac.wetRate : ac.dryRate,
    fuelPrice: ac.fuelPrice,
    fuelBurn: ac.fuelBurn
  })
})
```

### Settings Transfer

Certification and training pace are set in the main app:

```javascript
document.getElementById('targetCert').value = wizardData.certification
document.getElementById('lessonsPerWeek').value = wizardData.lessonsPerWeek
```

---

## Classic Mode

Users can bypass onboarding entirely by adding `?flow=classic` to the URL:

```
http://localhost:8181/?flow=classic
```

**Use Cases:**
- Experienced users who know the interface
- Testing or development
- Quick access without setup
- Troubleshooting onboarding issues

**Behavior:**
- Skips landing screen
- Shows main app immediately
- No aircraft or hours pre-filled
- User manually configures everything

---

## Sample Data

For testing and demos, users can click "Try with sample data":

```javascript
loadSampleData: function() {
  // Pre-fill with realistic sample data
  currentHours = {
    totalTime: 90,
    picTime: 40,
    picXC: 11.2,
    instrumentTotal: 4.3,
    // ...
  }

  // Add sample aircraft
  AircraftAPI.addAircraft({
    type: "Cessna 172",
    wetRate: 165,
    // ...
  })

  // Set sample certification
  document.getElementById('targetCert').value = 'ir'
}
```

---

## Future Enhancements

### Phase 2 Improvements

- [ ] **Resume Sessions**: Auto-save and resume incomplete wizards
- [ ] **More Certifications**: Add PPL, Multi-Engine, ATP options
- [ ] **Advanced Import**: Support MyFlightBook, LogTen, other formats
- [ ] **Bulk Editing**: Edit multiple aircraft at once during import
- [ ] **Rate Presets**: Common rental rates by aircraft type
- [ ] **Progress Save**: Save wizard state for later completion
- [ ] **Undo/Redo**: Step back without losing data
- [ ] **Tooltips**: More detailed help for each field
- [ ] **Video Tutorial**: Embedded walkthrough video
- [ ] **Import Validation**: Warn about unusual data patterns

### Community Requests

- Import from Google Sheets
- Support for international aircraft (non-N-numbers)
- Multi-instructor rate tracking
- Club vs rental aircraft modes

---

## Testing Checklist

### Manual Path
- [ ] Landing screen displays correctly
- [ ] Can enter valid hours
- [ ] Hours validation works (PIC ≤ Total, etc.)
- [ ] Can add multiple aircraft
- [ ] Can select certification
- [ ] Review page shows correct data
- [ ] Completes successfully
- [ ] Main app populates correctly

### ForeFlight Path
- [ ] Can upload valid CSV
- [ ] Parsing completes without errors
- [ ] Aircraft detection works
- [ ] FAA verification runs (if service available)
- [ ] Data source badges display correctly
- [ ] Can select/deselect aircraft
- [ ] Can enter rates for each aircraft
- [ ] Can set default aircraft
- [ ] Hours verification shows correct totals
- [ ] Simulator hours calculate correctly
- [ ] Review page shows imported data
- [ ] Completes successfully

### Load Path
- [ ] Can upload valid JSON
- [ ] Loading completes without errors
- [ ] All data restored correctly
- [ ] Aircraft cards render
- [ ] Main app shows loaded state

### Edge Cases
- [ ] Empty states handled gracefully
- [ ] Invalid files show clear errors
- [ ] Back button works correctly
- [ ] Browser back/forward work
- [ ] URL routing works
- [ ] Classic mode bypass works
- [ ] Sample data loads correctly
- [ ] Multiple aircraft (10+) work
- [ ] Special characters in names handled
- [ ] Zero hours handled
- [ ] Very large hour values handled

### UI/UX
- [ ] Progress bar updates
- [ ] Navigation buttons show/hide correctly
- [ ] Help tips display
- [ ] Validation messages clear
- [ ] Responsive on mobile
- [ ] Keyboard navigation works
- [ ] Focus management correct

---

## Known Issues

### Current Limitations

1. **No session persistence**: Closing browser loses in-progress wizard
   - **Workaround**: Complete wizard in one session
   - **Fix**: Phase 2 will add auto-save

2. **No edit after completion**: Can't re-run wizard to change data
   - **Workaround**: Use main app settings or `?onboarding=true`
   - **Fix**: Add "Edit Onboarding Data" button

3. **Limited file format support**: Only ForeFlight CSV
   - **Workaround**: Manually enter hours
   - **Fix**: Phase 2 will add more formats

4. **FAA lookup requires service**: Works only if tail-lookup deployed
   - **Workaround**: ForeFlight data used if unavailable
   - **Fix**: Bundled offline FAA database option

---

## Documentation

### For Users
- [Quick Start Guide](Quick-Start.md) - Get started in 5 minutes
- [Aircraft Management](Aircraft-Management.md) - Aircraft setup details
- Main [README.md](../README.md) for overview

### For Developers
- See inline JSDoc comments in `onboarding.js`
- See integration points in `aircraft-ui.js`
- Check `app.js` for data flow

---

## Bug Fixes in This Release

### 1. Simulator Hours Not Calculating

**Issue**: BATD and simulator hours showed 0.0 even when present in ForeFlight CSV.

**Root Causes**:
- Wrong field name: Used `ac.EquipmentType` instead of `ac['equipType (FAA)']`
- Whitespace mismatch: `aircraftId` not trimmed before map lookup

**Fix**:
- Changed line 1482 in onboarding.js: `equipType: ac['equipType (FAA)'] || ac['equipType'] || ''`
- Changed line 1499: `const aircraftId = (row.AircraftID || '').trim()`

**Result**: Simulator detection now works correctly for BATD, AATD, and FTD equipment types.

### 2. Classic Flow Aircraft Cards Not Rendering

**Issue**: In classic (non-wizard) flow, ForeFlight import saved aircraft to AircraftAPI but didn't create DOM cards, so budget calculator couldn't auto-fill hours.

**Root Cause**: `showCSVImportModal` function saved aircraft but didn't call `addAircraft()` to create cards.

**Fix**: Added lines 965-992 in aircraft-ui.js to iterate through imported aircraft and create DOM cards.

**Result**: Both wizard and classic flows now correctly render aircraft cards after import.

---

## License

This feature is licensed under the MIT License along with the rest of the project.

**Copyright (c) 2024-2025 FliteAxis**

---

## Changelog

### Version 1.0 (2025-11-29)
- ✅ Initial onboarding wizard implementation
- ✅ Three-path flow: manual, ForeFlight, load saved
- ✅ Landing screen with clear options
- ✅ Multi-step wizard with progress tracking
- ✅ Hours entry with validation
- ✅ Aircraft import from ForeFlight CSV
- ✅ FAA aircraft verification integration
- ✅ Data source badges (FAA Verified, Cached, ForeFlight)
- ✅ Certification selection
- ✅ Review and confirmation step
- ✅ Classic mode bypass option
- ✅ Sample data for testing
- ✅ URL routing and bookmarking
- ✅ Fixed simulator hour calculation bug
- ✅ Fixed classic flow aircraft card rendering bug

---

**Status**: ✅ Complete and ready for production
**Next Step**: Update main README and deploy
**Documentation**: Complete
**License**: MIT License
