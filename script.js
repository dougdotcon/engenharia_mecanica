document.addEventListener("DOMContentLoaded", () => {
  if (window.lucide?.createIcons) {
    window.lucide.createIcons();
  }

  const SQRT3 = Math.sqrt(3);
  const decimalFormatter = new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const integerFormatter = new Intl.NumberFormat("pt-BR");

  const readNumber = (element) => {
    if (!element) {
      return Number.NaN;
    }

    const raw = String(element.value ?? "").trim().replace(",", ".");
    if (raw === "") {
      return Number.NaN;
    }

    const value = Number(raw);
    return Number.isFinite(value) ? value : Number.NaN;
  };

  const formatDecimal = (value) => decimalFormatter.format(value);
  const formatInteger = (value) => integerFormatter.format(Math.round(value));

  const bindCalculator = ({ inputs, result, hint, compute, defaultResult, defaultHint }) => {
    const inputElements = inputs.map((id) => document.getElementById(id)).filter(Boolean);
    const resultElement = document.getElementById(result);
    const hintElement = document.getElementById(hint);

    if (!inputElements.length || !resultElement || !hintElement) {
      return;
    }

    const update = () => {
      const values = inputElements.map(readNumber);
      const output = compute(values);

      resultElement.textContent = output.result ?? defaultResult;
      hintElement.textContent = output.hint ?? defaultHint;
    };

    inputElements.forEach((element) => {
      element.addEventListener("input", update);
      element.addEventListener("change", update);
    });

    update();
  };

  const menuButton = document.querySelector("[data-menu-toggle]");
  const mobilePanel = document.querySelector("[data-mobile-panel]");
  const menuOpenIcon = document.querySelector("[data-menu-open-icon]");
  const menuCloseIcon = document.querySelector("[data-menu-close-icon]");
  const menuLabel = document.querySelector("[data-menu-label]");
  const header = document.querySelector(".site-header");

  const setMenuOpen = (isOpen) => {
    if (!menuButton || !mobilePanel) {
      return;
    }

    mobilePanel.hidden = !isOpen;
    menuButton.setAttribute("aria-expanded", String(isOpen));

    if (menuLabel) {
      menuLabel.textContent = isOpen ? "Fechar" : "Menu";
    }

    if (menuOpenIcon && menuCloseIcon) {
      menuOpenIcon.hidden = isOpen;
      menuCloseIcon.hidden = !isOpen;
    }
  };

  if (menuButton && mobilePanel) {
    menuButton.addEventListener("click", () => {
      setMenuOpen(mobilePanel.hidden);
    });

    document.querySelectorAll("[data-nav-link]").forEach((link) => {
      link.addEventListener("click", () => {
        setMenuOpen(false);
      });
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    });

    document.addEventListener("click", (event) => {
      if (!mobilePanel.hidden && header && !header.contains(event.target)) {
        setMenuOpen(false);
      }
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 760) {
        setMenuOpen(false);
      }
    });
  }

  const navLinks = [...document.querySelectorAll("[data-nav-link]")];
  const sectionLinks = new Map(
    navLinks
      .map((link) => {
        const hash = link.getAttribute("href");
        return hash?.startsWith("#") ? [hash.slice(1), link] : null;
      })
      .filter(Boolean)
  );

  const setActiveLink = (sectionId) => {
    navLinks.forEach((link) => link.classList.remove("is-active"));
    const active = sectionLinks.get(sectionId);
    if (active) {
      active.classList.add("is-active");
    }
  };

  const initialSection = window.location.hash?.slice(1);
  if (initialSection && sectionLinks.has(initialSection)) {
    setActiveLink(initialSection);
  } else {
    setActiveLink("dados-tecnicos");
  }

  if ("IntersectionObserver" in window) {
    const observedSections = document.querySelectorAll("main section[id]");
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (visible) {
          setActiveLink(visible.target.id);
        }
      },
      {
        rootMargin: "-35% 0px -55% 0px",
        threshold: [0.12, 0.2, 0.32],
      }
    );

    observedSections.forEach((section) => observer.observe(section));
  }

  bindCalculator({
    inputs: ["calc-kva-s", "calc-kva-v"],
    result: "result-kva",
    hint: "hint-kva",
    defaultResult: "0,00 A",
    defaultHint: "Informe a potência aparente e a tensão de linha para obter a corrente.",
    compute: ([s, v]) => {
      if (s > 0 && v > 0) {
        const current = (s * 1000) / (SQRT3 * v);
        return {
          result: `${formatDecimal(current)} A`,
          hint: `Para ${formatDecimal(s)} kVA em ${formatDecimal(v)} V trifásico, a corrente de linha é ${formatDecimal(current)} A.`,
        };
      }

      return {
        result: "0,00 A",
        hint: "Informe a potência aparente e a tensão de linha para obter a corrente.",
      };
    },
  });

  bindCalculator({
    inputs: ["calc-kw-p", "calc-kw-v", "calc-kw-fp"],
    result: "result-kw",
    hint: "hint-kw",
    defaultResult: "0,00 A",
    defaultHint: "FP usual de gerador: 0,8 quando o valor de placa não estiver disponível.",
    compute: ([p, v, fp]) => {
      if (p > 0 && v > 0 && fp > 0 && fp <= 1) {
        const current = (p * 1000) / (SQRT3 * v * fp);
        return {
          result: `${formatDecimal(current)} A`,
          hint: `Com FP ${formatDecimal(fp)}, ${formatDecimal(p)} kW equivalem a aproximadamente ${formatDecimal(p / fp)} kVA.`,
        };
      }

      return {
        result: "0,00 A",
        hint: "Use FP entre 0,01 e 1,00. Valor usual de gerador: 0,8.",
      };
    },
  });

  bindCalculator({
    inputs: ["calc-exc-v", "calc-exc-r"],
    result: "result-exc",
    hint: "hint-exc",
    defaultResult: "0,00 A",
    defaultHint: "Valor aproximado; em campo, o ideal é medir com alicate DC em um único condutor.",
    compute: ([vavr, rfield]) => {
      if (vavr > 0 && rfield > 0) {
        const current = vavr / rfield;
        return {
          result: `${formatDecimal(current)} A`,
          hint: `Estimativa pela lei de Ohm: ${formatDecimal(vavr)} Vdc ÷ ${formatDecimal(rfield)} Ω = ${formatDecimal(current)} A.`,
        };
      }

      return {
        result: "0,00 A",
        hint: "Valor aproximado; em campo, o ideal é medir com alicate DC em um único condutor.",
      };
    },
  });

  bindCalculator({
    inputs: ["calc-sync-hz", "calc-sync-poles"],
    result: "result-sync",
    hint: "hint-sync",
    defaultResult: "0 rpm",
    defaultHint: "Informe frequência e número de polos para obter a rotação síncrona.",
    compute: ([hz, poles]) => {
      if (hz > 0 && poles > 0) {
        const rpm = (120 * hz) / poles;
        return {
          result: `${formatInteger(rpm)} rpm`,
          hint: `${formatDecimal(hz)} Hz com ${formatInteger(poles)} polos resulta em ${formatInteger(rpm)} rpm síncronos.`,
        };
      }

      return {
        result: "0 rpm",
        hint: "Informe frequência e número de polos para obter a rotação síncrona.",
      };
    },
  });

  bindCalculator({
    inputs: ["calc-torque-p", "calc-torque-rpm"],
    result: "result-torque",
    hint: "hint-torque",
    defaultResult: "0,00 N·m",
    defaultHint: "Útil para comparar a carga do motor primário e o acoplamento do conjunto.",
    compute: ([power, rpm]) => {
      if (power > 0 && rpm > 0) {
        const torque = (9550 * power) / rpm;
        return {
          result: `${formatDecimal(torque)} N·m`,
          hint: `Com ${formatDecimal(power)} kW a ${formatInteger(rpm)} rpm, o torque no eixo é ${formatDecimal(torque)} N·m.`,
        };
      }

      return {
        result: "0,00 N·m",
        hint: "Útil para comparar a carga do motor primário e o acoplamento do conjunto.",
      };
    },
  });

  bindCalculator({
    inputs: ["calc-freq-rpm", "calc-freq-poles"],
    result: "result-freq",
    hint: "hint-freq",
    defaultResult: "0,00 Hz",
    defaultHint: "Em 1.800 rpm com 4 polos, a frequência deve ser 60 Hz.",
    compute: ([rpm, poles]) => {
      if (rpm > 0 && poles > 0) {
        const hz = (rpm * poles) / 120;
        return {
          result: `${formatDecimal(hz)} Hz`,
          hint: `Com ${formatInteger(rpm)} rpm e ${formatInteger(poles)} polos, a frequência calculada é ${formatDecimal(hz)} Hz.`,
        };
      }

      return {
        result: "0,00 Hz",
        hint: "Em 1.800 rpm com 4 polos, a frequência deve ser 60 Hz.",
      };
    },
  });

  window.requestAnimationFrame(() => {
    if (window.lucide?.createIcons) {
      window.lucide.createIcons();
    }
  });
});
