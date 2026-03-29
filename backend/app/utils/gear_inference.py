"""
Gear Type Inference Module
Infers landing gear type (Fixed or Retractable) from aircraft make/model.
"""

import re
from typing import Optional


def infer_gear_type(make: Optional[str], model: Optional[str]) -> Optional[str]:
    """
    Infer landing gear type from aircraft make and model.

    Returns:
        "Fixed" for fixed landing gear
        "Retractable" for retractable landing gear
        None if cannot be determined
    """
    if not make or not model:
        return None

    make_upper = make.upper().strip()
    model_upper = model.upper().strip()

    # Cessna patterns
    if "CESSNA" in make_upper or "CESSNA" in model_upper:
        # Retractable: R prefix (R172, R182, RG), 210, 337, 340, 414, 421, etc.
        if any(
            [
                model_upper.startswith("R"),  # R172, R182, RG
                re.match(r"^210", model_upper),  # 210 series
                re.match(r"^T210", model_upper),  # Turbo 210
                re.match(r"^P210", model_upper),  # Pressurized 210
                re.match(r"^310", model_upper),  # 310 series
                re.match(r"^320", model_upper),  # 320 series
                re.match(r"^335", model_upper),  # 335
                re.match(r"^336", model_upper),  # 336
                re.match(r"^337", model_upper),  # 337 Skymaster
                re.match(r"^340", model_upper),  # 340
                re.match(r"^401", model_upper),  # 401
                re.match(r"^402", model_upper),  # 402
                re.match(r"^404", model_upper),  # 404 Titan
                re.match(r"^411", model_upper),  # 411
                re.match(r"^414", model_upper),  # 414 Chancellor
                re.match(r"^421", model_upper),  # 421 Golden Eagle
                "CITATION" in model_upper,  # Jets
            ]
        ):
            return "Retractable"
        # Fixed gear: 120, 140, 150, 152, 170, 172, 175, 177, 180, 182, 185, 188, 206
        return "Fixed"

    # Piper patterns
    if "PIPER" in make_upper or "PIPER" in model_upper:
        # Retractable: PA-23, PA-24, PA-28R, PA-30, PA-32R, PA-34, PA-39, PA-44, PA-46, PA-60
        if any(
            [
                "PA-23" in model_upper,  # Apache, Aztec
                "PA-24" in model_upper,  # Comanche
                "PA-28R" in model_upper or "PA28R" in model_upper,  # Arrow
                "PA-30" in model_upper,  # Twin Comanche
                "PA-32R" in model_upper or "PA32R" in model_upper,  # Lance, Saratoga RG
                "PA-34" in model_upper,  # Seneca
                "PA-39" in model_upper,  # Twin Comanche C/R
                "PA-44" in model_upper,  # Seminole
                "PA-46" in model_upper,  # Malibu, Meridian, M-Class
                "PA-60" in model_upper,  # Aerostar
                "ARROW" in model_upper,
                "LANCE" in model_upper,
                "COMANCHE" in model_upper,
                "AZTEC" in model_upper,
                "SENECA" in model_upper,
                "SEMINOLE" in model_upper,
                "MALIBU" in model_upper,
                "MERIDIAN" in model_upper,
                "AEROSTAR" in model_upper,
                "NAVAJO" in model_upper,
                "CHEYENNE" in model_upper,
            ]
        ):
            return "Retractable"
        # Fixed gear: PA-28 (Cherokee, Warrior, Archer), PA-32 (Cherokee Six), PA-38 (Tomahawk)
        return "Fixed"

    # Beechcraft patterns
    if any(x in make_upper for x in ["BEECH", "RAYTHEON", "HAWKER"]):
        # Most Beechcraft are retractable except Skipper, Musketeer, Sport
        if any(
            [
                "SKIPPER" in model_upper,
                "MUSKETEER" in model_upper and "RETRACT" not in model_upper,
                "SPORT" in model_upper and "RETRACT" not in model_upper,
            ]
        ):
            return "Fixed"
        # Bonanza, Baron, Duke, King Air, etc. - all retractable
        return "Retractable"

    # Mooney patterns (almost all retractable)
    if "MOONEY" in make_upper:
        # All M20 series and most Mooneys are retractable
        return "Retractable"

    # Cirrus patterns (all fixed gear with parachute)
    if "CIRRUS" in make_upper:
        # SR20, SR22, SF50 - all fixed gear (even though they're high-performance)
        return "Fixed"

    # Diamond patterns (all fixed gear)
    if "DIAMOND" in make_upper:
        # DA20, DA40, DA42, DA62 - all fixed gear
        return "Fixed"

    # Grumman/American General patterns
    if any(x in make_upper for x in ["GRUMMAN", "AMERICAN GENERAL", "GULFSTREAM AMERICAN"]):
        if any(
            [
                "AA-1" in model_upper,  # Yankee, Trainer
                "AA-5" in model_upper,  # Cheetah, Tiger
            ]
        ):
            return "Fixed"
        if any(
            [
                "AG-5B" in model_upper,  # Tiger
            ]
        ):
            return "Fixed"
        # Most Grumman are fixed, but check for specific retractable models
        return "Fixed"

    # Rockwell/Commander patterns
    if any(x in make_upper for x in ["ROCKWELL", "COMMANDER"]):
        if "112" in model_upper or "114" in model_upper:
            return "Retractable"
        return "Fixed"

    # Bellanca patterns
    if "BELLANCA" in make_upper:
        # Most Bellancas are fixed, Viking is retractable
        if "VIKING" in model_upper:
            return "Retractable"
        return "Fixed"

    # Socata patterns
    if "SOCATA" in make_upper or "TOBAGO" in model_upper or "TRINIDAD" in model_upper:
        if "TRINIDAD" in model_upper or "TB-20" in model_upper or "TB-21" in model_upper:
            return "Retractable"
        return "Fixed"  # Tobago, Tampico

    # Maule patterns (all conventional fixed gear taildraggers)
    if "MAULE" in make_upper:
        return "Fixed"

    # Cessna TTx / Columbia / Corvalis (all fixed)
    if any(x in model_upper for x in ["TTX", "COLUMBIA", "CORVALIS"]):
        return "Fixed"

    # Default: cannot determine
    return None


def should_be_complex(make: Optional[str], model: Optional[str], gear_type: Optional[str] = None) -> bool:
    """
    Determine if aircraft should be considered complex.
    Complex = retractable gear + flaps + constant-speed prop.

    We can infer this for common aircraft types.
    """
    if not make or not model:
        return False

    # Use inferred gear type if not provided
    if not gear_type:
        gear_type = infer_gear_type(make, model)

    # If not retractable, definitely not complex
    if gear_type != "Retractable":
        return False

    make_upper = make.upper().strip()
    model_upper = model.upper().strip()

    # Known complex aircraft
    complex_patterns = [
        # Cessna retractables (all have constant speed props)
        (
            lambda: "CESSNA" in make_upper
            and any(
                [
                    model_upper.startswith("R"),
                    "210" in model_upper,
                    "310" in model_upper,
                ]
            )
        ),
        # Piper retractables (Arrow, Lance, Comanche, etc. - all complex)
        (lambda: "PIPER" in make_upper and gear_type == "Retractable"),
        # Beechcraft retractables (Bonanza, Baron, etc. - all complex)
        (lambda: any(x in make_upper for x in ["BEECH", "RAYTHEON"]) and gear_type == "Retractable"),
        # Mooney (all retractable, all complex)
        (lambda: "MOONEY" in make_upper),
        # Rockwell Commander 112/114
        (
            lambda: any(x in make_upper for x in ["ROCKWELL", "COMMANDER"])
            and any(x in model_upper for x in ["112", "114"])
        ),
    ]

    return any(check() for check in complex_patterns)


def should_be_high_performance(make: Optional[str], model: Optional[str]) -> bool:
    """
    Determine if aircraft should be considered high-performance.
    High-performance = engine > 200 HP.

    We can infer this for common aircraft types.
    """
    if not make or not model:
        return False

    model_upper = model.upper().strip()

    # Known high-performance aircraft (> 200 HP)
    hp_patterns = [
        # Cessna
        "R182",
        "182RG",
        "T182",
        "TR182",  # 230-235 HP
        "206",
        "207",
        "208",  # 285-300 HP
        "210",  # 285-310 HP
        # Piper
        "PA-24",
        "COMANCHE",  # 250-260 HP
        "PA-28R-200",
        "PA-28R-201",
        "ARROW IV",  # 200 HP (borderline)
        "PA-32",
        "SARATOGA",
        "LANCE",
        "SIX",  # 260-300 HP
        "PA-46",
        "MALIBU",
        "MERIDIAN",  # 310-350 HP
        # Beechcraft
        "BONANZA",
        "BARON",
        "DUKE",  # 260-380 HP
        # Mooney (most are > 200 HP)
        "M20J",
        "M20K",
        "M20M",
        "M20R",
        "M20S",
        "M20T",
        "M20U",
        # Cirrus
        "SR22",  # 310 HP
        # Diamond
        "DA42",
        "DA62",  # Twin diesel
    ]

    return any(pattern in model_upper for pattern in hp_patterns)
