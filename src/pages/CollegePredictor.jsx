import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { predictorAccess, bumpUsed } from '../constants/predictorLimits'
import { apiFetch } from '../utils/api'
import campusBullLogo from '../campus-bull-logo.png'
import './CollegePredictor.css'

import { STATES_LIST } from '../constants/states'
const TYPES  = ['All', 'Government', 'Private', 'AIIMS', 'Deemed']

const QUOTA_MAPPING = {
  "Central": [
    "ACMS-ArmyWard", "AFMS", "AFMS0DNB", "AIQ", "CMC 5-% Seats", "DNB Post MBBS", "MM", "MNG", "MQ1", "NBE Diploma", "NRI", "Other State"
  ],
  "delhis": [
    "ACMS-DelhiQuota", "ACMS-OutsideDelhi", "DU", "IP", "IP-DelhiQuota"
  ],
  "andhra_pradeshes": [
    "AP Govt Quota - AP Local", "AP Govt-AP UNR", "AP Govt-LOC(AU)", "AP Govt-LOC(OU)", "AP Govt-LOC(SVU)", "AP Govt-NS AP LOC", "AP Govt-NS APUR", "AP Govt-NS LOC (AU)", "AP Govt-NS LOC (OU)", "AP Govt-NS LOC (SVU)", "AP Govt-NS UNR", "AP Govt-Serv APUR", "AP Govt-Serv LOC (AU)", "AP Govt-Serv LOC (SVU)", "AP Govt-Serv UNR", "AP Govt-UNR", "APMgmt-CA NRI", "APMgmt-CA SF", "APMgmt-CatB1", "APMgmt-CatB1- MIN", "APMgmt-CatB2", "APMgmt-CatC(NRI)", "APMgmt-CatC(NRI)-MIN", "APMgmt-S1-All-CatB", "APMgmt-S1B-LOC-CatB", "APMgmt-S2-CatC-NRI", "APMgmt-S3-CatC-Inst"
  ],
  "bihars": [
    "Bihar Priv-Open", "Bihar-Priv-GEN"
  ],
  "chhattisgarhs": [
    "CHTSGRH-Pvt-MgmtQuota"
  ],
  "gujarats": [
    "GUJ Govt-AllGujStud.", "GUJ Govt-Inservice", "GUJ Govt-Inst. Pref", "GUJ Mgmt Quota", "GUJ Mgmt-NRI", "Gujarat Govt Seats", "Gujarat Local Seats", "Gujarat Mgmt Seats", "Gujarat NRI Seats"
  ],
  "haryanas": [
    "HAR Priv-MGMT", "HAR Priv-Mgmt"
  ],
  "himachal_pradeshes": [
    "HP Mgmt - All", "HP Priv All"
  ],
  "jharkhands": [
    "JHKND-Pvt-MNGAllIndia"
  ],
  "karnatakas": [
    "KAR DNB Serv", "KAR Govt Quota", "KAR Govt Quota-InS", "KAR Govt Quota-Open", "KAR NRI Quota", "KAR Others (Inst.Q)", "KAR Others (Q)", "KAR Priv Seats-GMP", "KAR Priv Seats-Min", "KAR Priv Seats-Min.", "KAR Priv Seats-Open"
  ],
  "kerlas": [
    "KER SF-All India"
  ],
  "maharashtras": [
    "MAHA Priv-Mgmt Quota", "MAHA Priv-Min Quota", "MAHA-Govt Quota", "MAHA-Govt-All", "MAHA-Govt-AllW", "MAHA-Govt-Defense", "MAHA-Govt-DefenseW", "MAHA-Govt-HillyArea", "MAHA-Govt-HillyAreaW", "MAHA-Govt-MKB", "MAHA-Govt-MKBW", "MAHA-NRI Quota"
  ],
  "madhya_pradeshes": [
    "MP Govt-NonDomicile", "MP Priv-NonDomicile"
  ],
  "punjabs": [
    "PB - Govt Quota", "PB Priv-AdeshAllIndia", "PB Priv-AdeshGenMerit", "PB Priv-DMC Mgmt", "PB Priv-SGRDGener."
  ],
  "pondicherries": [
    "PY Mgmt-Open"
  ],
  "rajasthans": [
    "RAJ Priv-All India", "RAJ Priv-Mgmt Quota"
  ],
  "sikkims": [
    "Sikkim Gen Quota", "Sikkim Mgmt Quota"
  ],
  "telanganas": [
    "TELMgmt-MQ1-CatB-All", "TELMgmt-MQ2-CatC-NRI", "TELMgmt-MQ3-CatC-Inst", "Tel Govt-LOC (AU)", "Tel Govt-LOC (OU)", "Tel Govt-LOC (SVU)", "Tel Govt-NS LOC", "Tel Govt-NS UNR", "Tel Govt-Serv LOC", "Tel Govt-Serv UNR", "Tel Govt-UNR", "Tel Mgmt-Cat B-LOC", "Tel Mgmt-Cat B-UNR", "Tel Mgmt-Cat C(NRI)"
  ],
  "tamil_nadus": [
    "TN CMC-General Merit", "TN CMC-Inst Preference", "TN CMC-Minority Network", "TN CMC-Service", "TN Govt 7.5%", "TN Govt 92.5%", "TN Govt Quota", "TN Mgmt Quota", "TN Mgmt Quota-MIN", "TN Mgmt Quota-NRI", "TN Mgmt Quota-NRILAPSE", "TN Mgmt-Christian Min", "TN Mgmt-Malayalam Min", "TN Mgmt-Telugu Min", "TN NRI Quota", "TN-CMC Minority 2-"
  ],
  "tripuras": [
    "Tripura Pvt All India"
  ],
  "uttarakhands": [
    "UK Priv-AllIndia/Mgmt", "UK-Pvt-AllIndiaQuota"
  ],
  "uttar_pradeshes": [
    "UP Priv-Min. Quota", "UP Priv-Open Quota", "UP-DNB InS", "UP-Govt Quota"
  ],
  "west_bengals": [
    "WB DNB Serv", "WB Govt Quota", "WB Mgmt Quota", "WB NRI Quota"
  ]
};

const CATEGORY_MAPPING = {
  "Central": {
    "GEN": ["GEN", "OPEN", "UR"],
    "OBC": ["OBC"],
    "SC": ["SC"],
    "ST": ["ST"],
    "EWS": ["EWS"],
    "PwD": ["GEN0PwD", "OBC0PwD", "SC0PwD", "ST0PwD", "EWS0PwD"],
    "AFMS": ["AFMS0Priority III", "AFMS0Priority IV"]
  },
  "karnatakas": {
    "GEN": ["GEN", "OPEN", "UR", "GM", "GMH", "GMK", "GMKH", "GMR", "GMRH", "OPEN-GEN", "OPEN-FEM", "OPN"],
    "OBC": ["OBC", "1G", "1H", "1K", "1KH", "1R", "1RH", "2AG", "2AH", "2AK", "2AKH", "2AR", "2ARH", "2BG", "2BH", "2BK", "2BKH", "2BR", "2BRH", "3AG", "3AH", "3AK", "3AKH", "3AR", "3ARH", "3BG", "3BH", "3BK", "3BKH", "3BR", "3BRH"],
    "SC": ["SC", "SCG", "SCH", "SCK", "SCKH", "SCR", "SCRH"],
    "ST": ["ST", "STG", "STH", "STK", "STKH", "STR", "STRH"],
    "EWS": ["EWS"],
    "MANAGEMENT/NRI": ["GMP", "GMPH", "NRI"]
  },
  "andhra_pradeshes": {
    "GEN": ["GEN", "OPEN", "UR", "OC", "OC Open", "OC Serv", "OPEN-GEN", "OPEN-FEM", "OP", "Open"],
    "OBC/BC": ["OBC", "BC", "BC Open", "BC Serv", "BC Service", "BCA-GEN", "BCB-GEN", "BCC-GEN", "BCD-GEN", "BCE-GEN", "BCM"],
    "SC": ["SC", "SC Open", "SC Serv", "SC Service", "SC-OP", "SC-PH"],
    "ST": ["ST", "ST Open", "ST Serv", "ST Service", "ST-OP", "ST-PH"],
    "EWS": ["EWS", "EWS Open", "EWS Service", "EWS-PH"],
    "MINORITY": ["Christian Minority", "Malayalam Minority", "Telugu Minority", "BCM"],
    "MANAGEMENT/NRI": ["CAT B1", "CAT B2", "CAT C(NRI)", "CA NRI", "MNG", "MQ", "MQ1", "MQ2", "MQ3", "NQ-NRI", "NRI"]
  },
  "telanganas": {
    "GEN": ["GEN", "OPEN", "UR", "OC", "OC Open", "OC Serv", "OPEN-GEN", "OPEN-FEM", "OP", "Open"],
    "OBC/BC": ["OBC", "BC", "BC Open", "BC Serv", "BC Service", "BCA-GEN", "BCB-GEN", "BCC-GEN", "BCD-GEN", "BCE-GEN", "BCM"],
    "SC": ["SC", "SC Open", "SC Serv", "SC Service", "SC-OP", "SC-PH"],
    "ST": ["ST", "ST Open", "ST Serv", "ST Service", "ST-OP", "ST-PH"],
    "EWS": ["EWS", "EWS Open", "EWS Service", "EWS-PH"],
    "MINORITY": ["Christian Minority", "Malayalam Minority", "Telugu Minority", "BCM"],
    "MANAGEMENT/NRI": ["CAT B1", "CAT B2", "CAT C(NRI)", "CA NRI", "MNG", "MQ", "MQ1", "MQ2", "MQ3", "NQ-NRI", "NRI"]
  },
  "tamil_nadus": {
    "GEN": ["GEN", "OPEN", "UR", "OC", "BC", "BCM", "MBC"],
    "SC": ["SC", "SCA"],
    "ST": ["ST"],
    "EWS": ["EWS"],
    "MINORITY": ["Christian Minority", "Malayalam Minority", "Telugu Minority", "Minority"],
    "MANAGEMENT/NRI": ["NRI", "Management", "MGT", "NRI Lapsed"]
  },
  "maharashtras": {
    "GEN": ["GEN", "OPEN", "UR", "UR Open"],
    "OBC/SEBC": ["OBC", "SEBC", "NT1", "NT2", "NT3", "VJ", "VJA"],
    "SC": ["SC"],
    "ST": ["ST"],
    "EWS": ["EWS"],
    "SPECIAL": ["DEF1", "DEF2", "DEF3", "PH", "CAP"]
  },
  "gujarats": {
    "GEN": ["GEN", "OPEN", "UR", "OP", "GQ-OP", "IQ-OP", "UQ-OP"],
    "SC": ["SC", "GQ-SC", "IQ-SC", "UQ-SC"],
    "ST": ["ST", "GQ-ST", "IQ-ST", "UQ-ST"],
    "EWS": ["EWS", "GQ-EW", "IQ-EW", "UQ-EW"],
    "SEBC/OBC": ["OBC", "GQ-SE", "IQ-SE", "UQ-SE", "SE", "SEBC"]
  },
  "kerlas": {
    "GEN": ["GEN", "OPEN", "UR", "SM"],
    "OBC": ["OBC", "EZ", "MU", "LC", "BH", "BX", "OEC", "SEBC"],
    "SC": ["SC"],
    "ST": ["ST"],
    "EWS": ["EWS"]
  },
  "west_bengals": {
    "GEN": ["GEN", "OPEN", "UR"],
    "OBC": ["OBC", "OBC-A", "OBC-B"],
    "SC": ["SC"],
    "ST": ["ST"],
    "EWS": ["EWS"]
  },
  "uttar_pradeshes": {
    "GEN": ["GEN", "OPEN", "UR"],
    "OBC": ["OBC", "OBC-NCL"],
    "SC": ["SC"],
    "ST": ["ST"],
    "EWS": ["EWS"]
  },
  "madhya_pradeshes": {
    "GEN": ["GEN", "OPEN", "UR"],
    "OBC": ["OBC", "OBC-NCL"],
    "SC": ["SC"],
    "ST": ["ST"],
    "EWS": ["EWS"]
  },
  "bihars": {
    "GEN": ["GEN", "OPEN", "UR"],
    "OBC": ["OBC", "BC", "EBC"],
    "SC": ["SC"],
    "ST": ["ST"],
    "EWS": ["EWS"]
  },
  "rajasthans": {
    "GEN": ["GEN", "OPEN", "UR"],
    "OBC": ["OBC", "SBC", "MBC"],
    "SC": ["SC"],
    "ST": ["ST"],
    "EWS": ["EWS"]
  },
  "delhis": {
    "GEN": ["GEN", "OPEN", "UR"],
    "OBC": ["OBC", "OBC-NCL"],
    "SC": ["SC"],
    "ST": ["ST"],
    "EWS": ["EWS"]
  },
  "odishas": {
    "GEN": ["GEN", "OPEN", "UR"],
    "OBC": ["OBC", "SEBC"],
    "SC": ["SC"],
    "ST": ["ST"],
    "EWS": ["EWS"]
  },
  "haryanas": {
    "GEN": ["GEN", "OPEN", "UR"],
    "OBC": ["OBC", "BC-A", "BC-B"],
    "SC": ["SC"],
    "EWS": ["EWS"]
  },
  "punjabs": {
    "GEN": ["GEN", "OPEN", "UR"],
    "SC": ["SC", "SC (1st Priority)", "SC (2nd Priority)"],
    "BC": ["BC"],
    "EWS": ["EWS"]
  },
  "himachal_pradeshes": {
    "GEN": ["GEN", "OPEN", "UR"],
    "OBC": ["OBC"],
    "SC": ["SC"],
    "ST": ["ST"],
    "EWS": ["EWS"]
  },
  "jammu_and_kashmirs": {
    "GEN": ["GEN", "OPEN", "UR", "OM"],
    "OBC": ["OBC", "ALC/IB", "RBA"],
    "SC": ["SC"],
    "ST": ["ST"],
    "EWS": ["EWS"]
  },
  "uttarakhands": {
    "GEN": ["GEN", "OPEN", "UR"],
    "OBC": ["OBC", "OBC-NCL"],
    "SC": ["SC"],
    "ST": ["ST"],
    "EWS": ["EWS"]
  },
  "jharkhands": {
    "GEN": ["GEN", "OPEN", "UR"],
    "OBC": ["OBC", "BC1", "BC2"],
    "SC": ["SC"],
    "ST": ["ST"],
    "EWS": ["EWS"]
  },
  "chhattisgarhs": {
    "GEN": ["GEN", "OPEN", "UR"],
    "OBC": ["OBC"],
    "SC": ["SC"],
    "ST": ["ST"],
    "EWS": ["EWS"]
  },
  "assams": {
    "GEN": ["GEN", "OPEN", "UR"],
    "OBC": ["OBC", "MOBC"],
    "SC": ["SC"],
    "ST": ["ST", "STP", "STH"],
    "EWS": ["EWS"]
  },
  "manipurs": {
    "GEN": ["GEN", "OPEN", "UR"],
    "OBC": ["OBC"],
    "SC": ["SC"],
    "ST": ["ST"],
    "EWS": ["EWS"]
  },
  "tripuras": {
    "GEN": ["GEN", "OPEN", "UR"],
    "OBC": ["OBC"],
    "SC": ["SC"],
    "ST": ["ST"],
    "EWS": ["EWS"]
  },
  "sikkims": {
    "GEN": ["GEN", "OPEN", "UR", "SL"],
    "OBC": ["OBC"],
    "SC": ["SC"],
    "ST": ["ST"],
    "EWS": ["EWS"]
  },
  "pondicherries": {
    "GEN": ["GEN", "OPEN", "UR", "OC"],
    "OBC": ["OBC", "BC"],
    "SC": ["SC"],
    "ST": ["ST"],
    "EWS": ["EWS"]
  },
  "arunachal_pradeshes": {
    "GEN": ["GEN", "OPEN", "UR"],
    "OBC": ["OBC"],
    "SC": ["SC"],
    "ST": ["ST"],
    "EWS": ["EWS"]
  },
  "goas": {
    "GEN": ["GEN", "OPEN", "UR"],
    "OBC": ["OBC"],
    "SC": ["SC"],
    "ST": ["ST"],
    "EWS": ["EWS"]
  },
  "chandigarhs": {
    "GEN": ["GEN", "OPEN", "UR"],
    "OBC": ["OBC"],
    "SC": ["SC"],
    "ST": ["ST"],
    "EWS": ["EWS"]
  }
};

export default function CollegePredictor() {
  const { user } = useAuth()
  const [, forceTick] = useState(0)   // re-render after a run bumps the stored count
  const access = predictorAccess(user, 'college')
  const lockMessage = access.tier === 'FREE'
    ? 'College Predictor is a PRO feature. Upgrade to PRO to unlock it.'
    : 'You have used your College Predictor access. Contact admin for more.'
  const [limitError, setLimitError] = useState(null)

  // Derive defaults from user profile
  const profileRank = user?.bestRank || ''
  const profileCategory = user?.category || 'GEN'
  const profileCourse = user?.ugOrPg || 'UG'
  const profileState = STATES_LIST.find(s => s.label === user?.domicile)?.value || 'All'

  const [courseType,      setCourseType]       = useState(profileCourse)
  const [stateFilter,     setStateFilter]     = useState(profileState)
  const [typeFilter,      setTypeFilter]       = useState('All')
  const [counsellingType, setCounsellingType]  = useState(profileState === 'All' ? 'All' : 'State')
  const [category,        setCategory]         = useState(profileCategory)
  const [dynamicCategories, setDynamicCategories] = useState({})
  const [categoriesLoading, setCategoriesLoading] = useState(false)
  const [quota,           setQuota]            = useState('All')
  const [dynamicQuotas,   setDynamicQuotas]    = useState([])
  const [quotasLoading,   setQuotasLoading]    = useState(false)
  const [collegeSearch,   setCollegeSearch]    = useState('')
  const [collegeOptions,  setCollegeOptions]   = useState([])
  const [budget,          setBudget]           = useState('')
  const [limit,           setLimit]            = useState('20')
  const [rank,            setRank]             = useState(profileRank)
  const [searched,        setSearched]         = useState(false)
  const [apiColleges,     setApiColleges]      = useState([])
  const [apiLoading,      setApiLoading]       = useState(false)
  const [sortConfig,      setSortConfig]       = useState({ key: null, direction: 'asc' })

  // Sync profile values if user loads later
  useEffect(() => {
    if (user?.bestRank && !rank) setRank(user.bestRank)
    if (user?.category && category === 'GEN') setCategory(user.category)
    if (user?.ugOrPg && courseType === 'UG') setCourseType(user.ugOrPg)
  }, [user])

  // Fetch college names for dropdown
  useEffect(() => {
    async function fetchColleges() {
      try {
        const query = new URLSearchParams()
        if (counsellingType !== 'All' && counsellingType !== 'MCC') query.append('counsellingType', counsellingType)
        if (stateFilter !== 'All') query.append('state', stateFilter)
        const res = await apiFetch(`/predict/colleges?${query.toString()}`)
        if (Array.isArray(res)) setCollegeOptions(res)
      } catch (err) {
        console.warn('Failed to fetch college names', err)
      }
    }
    fetchColleges()
  }, [stateFilter, counsellingType])

  // Compute dynamic categories
  useEffect(() => {
    const grouped = JSON.parse(JSON.stringify(CATEGORY_MAPPING["Central"]));
    if (stateFilter !== 'All' && CATEGORY_MAPPING[stateFilter]) {
      const stateCats = CATEGORY_MAPPING[stateFilter];
      for (const [group, values] of Object.entries(stateCats)) {
        if (!grouped[group]) {
          grouped[group] = [];
        }
        const uniqueValues = new Set([...grouped[group], ...values]);
        grouped[group] = Array.from(uniqueValues);
      }
    }
    for (const group in grouped) {
      grouped[group].sort((a, b) => a.localeCompare(b));
    }
    setDynamicCategories(grouped);
    setCategory('GEN');
  }, [stateFilter])

  // Compute dynamic quotas
  useEffect(() => {
    let newQuotas = [...QUOTA_MAPPING["Central"]];
    if (stateFilter !== 'All' && QUOTA_MAPPING[stateFilter]) {
      newQuotas = [...newQuotas, ...QUOTA_MAPPING[stateFilter]];
    }
    newQuotas.sort((a, b) => a.localeCompare(b));
    setDynamicQuotas(newQuotas);
    setQuota('All');
  }, [stateFilter])

  const handleSearch = async () => {
    if (access.locked) { setLimitError(lockMessage); return }
    if (!rank) { alert('Please enter your NEET rank'); return }
    // Warn before spending a usage token (admins are unlimited, so no warning).
    if (!access.unlimited) {
      const ok = window.confirm(
        `Heads up — this will use 1 token. You have ${access.left} of ${access.limit} College Predictor run${access.limit !== 1 ? 's' : ''} left. Continue?`
      )
      if (!ok) return
    }
    setLimitError(null)
    setSearched(true)
    setApiLoading(true)
    try {
      const result = await apiFetch('/predict/college', {
        method: 'POST',
        body: JSON.stringify({
          rank: Number(rank),
          courseType: courseType,
          instType: typeFilter !== 'All' ? typeFilter : undefined,
          state: (counsellingType === 'State' && stateFilter !== 'All') ? stateFilter : undefined,
          counsellingType: counsellingType !== 'All' ? counsellingType : undefined,
          category: category,
          quota: quota,
          collegeName: collegeSearch.trim() || undefined,
          budget: budget ? Number(budget) : undefined,
          limit: limit
        })
      })
      setApiColleges(result.colleges || [])
      bumpUsed(user, 'college')       // count this run
      forceTick(t => t + 1)
    } catch (err) {
      if (err.status === 403) {
        setLimitError(err.message)
        setSearched(false)
      } else {
        console.warn('College API error:', err)
        setApiColleges([])
      }
    } finally {
      setApiLoading(false)
    }
  }

  // Load an image URL into a data URL so jsPDF can embed it.
  const toDataURL = (url) =>
    fetch(url).then(r => r.blob()).then(b => new Promise((res, rej) => {
      const fr = new FileReader()
      fr.onload = () => res(fr.result)
      fr.onerror = rej
      fr.readAsDataURL(b)
    }))

  const exportPDF = async () => {
    if (!apiColleges.length) return
    // Lazy-load the heavy PDF libs only on download (keeps initial bundle small).
    const { jsPDF } = await import('jspdf')
    const autoTable = (await import('jspdf-autotable')).default
    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })
    const pageW = doc.internal.pageSize.getWidth()

    // ── Branded header ──
    try {
      const logo = await toDataURL(campusBullLogo)
      doc.addImage(logo, 'PNG', 40, 22, 54, 36) // logo is 1.5:1
    } catch { /* logo optional */ }
    doc.setFont('helvetica', 'bold'); doc.setFontSize(18); doc.setTextColor(211, 47, 47)
    doc.text('Campus Bull', 106, 40)
    doc.setFont('helvetica', 'normal'); doc.setFontSize(11); doc.setTextColor(60, 60, 60)
    doc.text('College Predictions', 106, 56)
    doc.setFontSize(9); doc.setTextColor(120, 120, 120)
    doc.text(`Rank: ${rank || '-'}    Generated: ${new Date().toLocaleDateString()}`, pageW - 40, 40, { align: 'right' })
    doc.setDrawColor(211, 47, 47); doc.setLineWidth(1); doc.line(40, 66, pageW - 40, 66)

    const head = [['College Name', 'State', 'Type', 'Category', 'Quota', 'Fee', 'Year', 'R1', 'R2', 'R3', 'R4', 'R5']]
    const body = apiColleges.map(c => [
      c.name, c.state, c.type, c.category, c.quota || '-', c.course_fee || 'N/A', c.year,
      c.rounds?.r1 || '-', c.rounds?.r2 || '-', c.rounds?.r3 || '-', c.rounds?.r4 || '-', c.rounds?.r5 || '-',
    ])

    autoTable(doc, {
      head, body, startY: 76,
      styles: { fontSize: 7, cellPadding: 3, overflow: 'linebreak' },
      headStyles: { fillColor: [211, 47, 47], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 248, 248] },
      columnStyles: { 0: { cellWidth: 150 } },
      margin: { left: 40, right: 40 },
      didDrawPage: (data) => {
        const str = `Campus Bull · campusbull.com   —   Page ${doc.internal.getNumberOfPages()}`
        doc.setFontSize(8); doc.setTextColor(150)
        doc.text(str, pageW / 2, doc.internal.pageSize.getHeight() - 16, { align: 'center' })
      },
    })

    doc.save(`campusbull_college_predictions_rank${rank || ''}.pdf`)
  }

  const handleSort = (key) => {
    let direction = 'asc'
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc'
    setSortConfig({ key, direction })
  }

  const sortedColleges = [...apiColleges].sort((a, b) => {
    if (!sortConfig.key) return 0
    const valA = a[sortConfig.key]
    const valB = b[sortConfig.key]

    if (valA === undefined || valA === null) return 1
    if (valB === undefined || valB === null) return -1

    if (typeof valA === 'number' && typeof valB === 'number') {
      return sortConfig.direction === 'asc' ? valA - valB : valB - valA
    }

    const strA = valA.toString().toLowerCase()
    const strB = valB.toString().toLowerCase()
    if (strA < strB) return sortConfig.direction === 'asc' ? -1 : 1
    if (strA > strB) return sortConfig.direction === 'asc' ? 1 : -1
    return 0
  })

  const rankLocked = !!user?.bestRank && user?.role !== 'ADMIN'
  const categoryFromProfile = !!user?.category && user?.role !== 'ADMIN'
  const courseLocked = !!user?.ugOrPg && user?.role !== 'ADMIN'

  return (
    <div className="page-container">
      <div className="page-header animate-in">
        <div>
          <p className="section-label">College Finder</p>
          <h1 className="page-title">Medical College Predictor</h1>
          <p className="page-subtitle">
            Find best-fit colleges based on your rank, category &amp; state. Data from MCC &amp; state counselling 2023–24.
          </p>
        </div>
      </div>

      {/* Usage allowance / lock banner */}
      {access.locked ? (
        <div className="card animate-in" style={{ padding: '1.25rem 1.5rem', marginBottom: '1.25rem', background: 'linear-gradient(135deg, rgba(248,189,42,0.12), var(--surface-container-low))', borderLeft: '4px solid var(--secondary)', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <span className="material-icons" style={{ color: 'var(--secondary)', fontSize: '1.6rem' }}>workspace_premium</span>
          <div style={{ flex: 1, minWidth: 200 }}>
            <p style={{ fontWeight: 600, marginBottom: '0.2rem' }}>{lockMessage}</p>
            <p style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)' }}>
              {access.tier === 'FREE' ? 'PRO members get 1 College Predictor run.' : 'Your run has been used.'}
            </p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', marginBottom: '1.25rem', color: 'var(--on-surface-variant)' }}>
          <span className="material-icons" style={{ fontSize: '1rem', color: 'var(--primary)' }}>bolt</span>
          {access.unlimited
            ? <span><strong>Unlimited</strong> college searches (Admin)</span>
            : <span><strong>{access.left}</strong> of {access.limit} college search{access.limit !== 1 ? 'es' : ''} left · each search costs 1 token</span>}
        </div>
      )}

      {limitError && (
        <div className="card" style={{ padding: '0.75rem 1rem', marginBottom: '1.25rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', fontSize: '0.82rem' }}>
          {limitError}
        </div>
      )}

      {/* Profile Banner */}
      {user?.bestRank && (
        <div className="card animate-in" style={{ padding: '1rem 1.5rem', marginBottom: '1.25rem', background: 'linear-gradient(135deg, var(--primary)15, var(--surface-container-low))', borderLeft: '4px solid var(--primary)', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <span className="material-icons" style={{ color: 'var(--primary)' }}>lock</span>
          <p style={{ fontSize: '0.88rem' }}>
            <strong>Rank locked from your profile:</strong> #{user.bestRank.toLocaleString()}
            {user.category && <span> · Category: <strong>{user.category}</strong></span>}
            {user.ugOrPg && <span> · {user.ugOrPg}</span>}
            {' '}<a href="/dashboard/profile" style={{ color: 'var(--primary)', fontSize: '0.8rem' }}>Update in Profile →</a>
          </p>
        </div>
      )}

      {/* Filters */}
      <div className="card college-search-card animate-in">
        <div className="college-search-inner">

          {/* Rank — locked if profile has it */}
          <div className="field-group" style={{ flex: '1 1 160px' }}>
            <label className="field-label">
              <span className="material-icons" style={{ fontSize: '0.9rem' }}>insights</span>
              {' '}NEET Rank {rankLocked && <span style={{ color: '#4ade80', fontSize: '0.7rem' }}>● From Profile</span>}
            </label>
            <div className="input-icon-wrap">
              <span className="material-icons input-icon">{rankLocked ? 'lock' : 'leaderboard'}</span>
              <input
                className="field-input with-icon"
                type="number"
                placeholder="e.g. 32400"
                value={rank}
                onChange={e => !rankLocked && setRank(e.target.value)}
                readOnly={rankLocked}
                style={{ opacity: rankLocked ? 0.8 : 1, cursor: rankLocked ? 'not-allowed' : 'text' }}
              />
            </div>
          </div>

          {/* Counselling Type */}
          <div className="field-group" style={{ flex: '1 1 160px' }}>
            <label className="field-label">
              <span className="material-icons" style={{ fontSize: '0.9rem' }}>account_balance</span>
              {' '}Counselling
            </label>
            <select className="field-select" value={counsellingType} onChange={e => {
              setCounsellingType(e.target.value)
              if (e.target.value === 'MCC') setStateFilter('All')
            }}>
              <option value="All">All</option>
              <option value="MCC">MCC (All India)</option>
              <option value="State">State Quota</option>
            </select>
          </div>

          {/* State — only active when State counselling selected */}
          <div className="field-group" style={{ flex: '1 1 160px', opacity: counsellingType === 'State' ? 1 : 0.45, pointerEvents: counsellingType === 'State' ? 'auto' : 'none' }}>
            <label className="field-label">
              <span className="material-icons" style={{ fontSize: '0.9rem' }}>location_on</span>
              {' '}State
            </label>
            <select className="field-select" value={stateFilter} onChange={e => setStateFilter(e.target.value)} disabled={counsellingType !== 'State'}>
              {STATES_LIST.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          {/* Category */}
          <div className="field-group" style={{ flex: '1 1 140px' }}>
            <label className="field-label">
              <span className="material-icons" style={{ fontSize: '0.9rem' }}>people</span>
              {' '}Category {categoriesLoading && <span style={{ fontSize: '0.7rem' }}>⏳</span>}
            </label>
            <select className="field-select" value={category} onChange={e => setCategory(e.target.value)} disabled={categoriesLoading} style={{ opacity: categoriesLoading ? 0.8 : 1, cursor: categoriesLoading ? 'wait' : 'pointer' }}>
              <option value="All">All Categories</option>
              {Object.keys(dynamicCategories).length > 0 ? (
                Object.entries(dynamicCategories).map(([group, values]) => (
                  <optgroup key={group} label={group}>
                    {values.map(c => <option key={c} value={c}>{c}</option>)}
                  </optgroup>
                ))
              ) : (
                ['GEN', 'EWS', 'SC', 'ST', 'OBC', 'OBC-NCL'].map(c => <option key={c}>{c}</option>)
              )}
            </select>
          </div>

          {/* Quota */}
          <div className="field-group" style={{ flex: '1 1 140px' }}>
            <label className="field-label">
              <span className="material-icons" style={{ fontSize: '0.9rem' }}>event_seat</span>
              {' '}Seat Type / Quota {quotasLoading && <span style={{ fontSize: '0.7rem' }}>⏳</span>}
            </label>
            <select className="field-select" value={quota} onChange={e => setQuota(e.target.value)} disabled={quotasLoading} style={{ opacity: quotasLoading ? 0.8 : 1, cursor: quotasLoading ? 'wait' : 'pointer' }}>
              <option value="All">All Quotas</option>
              {dynamicQuotas.map(q => <option key={q} value={q}>{q}</option>)}
            </select>
          </div>

          {/* Course Type (UG/PG) — locked from profile */}
          <div className="field-group" style={{ flex: '1 1 120px' }}>
            <label className="field-label">
              <span className="material-icons" style={{ fontSize: '0.9rem' }}>school</span>
              {' '}Course {courseLocked && <span style={{ color: '#4ade80', fontSize: '0.7rem' }}>● Profile</span>}
            </label>
            <select className="field-select" value={courseType} onChange={e => !courseLocked && setCourseType(e.target.value)} disabled={courseLocked} style={{ opacity: courseLocked ? 0.8 : 1, cursor: courseLocked ? 'not-allowed' : 'pointer' }}>
              <option value="UG">UG (MBBS/BDS)</option>
              <option value="PG">PG (MD/MS)</option>
            </select>
          </div>

          {/* College Name */}
          <div className="field-group" style={{ flex: '1 1 220px' }}>
            <label className="field-label">
              <span className="material-icons" style={{ fontSize: '0.9rem' }}>school</span>
              {' '}College Name
            </label>
            <select className="field-select" value={collegeSearch} onChange={e => setCollegeSearch(e.target.value)}>
              <option value="">All Colleges</option>
              {collegeOptions.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Institution Type */}
          <div className="field-group" style={{ flex: '1 1 140px' }}>
            <label className="field-label">
              <span className="material-icons" style={{ fontSize: '0.9rem' }}>business</span>
              {' '}Inst. Type
            </label>
            <select className="field-select" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
              {TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>

          {/* Budget */}
          <div className="field-group" style={{ flex: '1 1 160px' }}>
            <label className="field-label">
              <span className="material-icons" style={{ fontSize: '0.9rem' }}>currency_rupee</span>
              {' '}Budget (Max ₹)
            </label>
            <input
              className="field-input"
              type="number"
              placeholder="e.g. 1500000"
              value={budget}
              onChange={e => setBudget(e.target.value)}
            />
          </div>

          {/* Limit */}
          <div className="field-group" style={{ flex: '1 1 120px' }}>
            <label className="field-label">
              <span className="material-icons" style={{ fontSize: '0.9rem' }}>format_list_numbered</span>
              {' '}Show
            </label>
            <select className="field-select" value={limit} onChange={e => setLimit(e.target.value)}>
              {['10', '20', '100', '1000'].map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>

          <button
            className="btn-primary"
            style={{ flex: '1 1 100%', justifyContent: 'center', marginTop: '0.5rem', opacity: (access.locked || apiLoading) ? 0.6 : 1, cursor: access.locked ? 'not-allowed' : 'pointer' }}
            onClick={handleSearch}
            disabled={apiLoading || access.locked}
          >
            <span className="material-icons">{access.locked ? 'lock' : apiLoading ? 'hourglass_empty' : 'search'}</span>
            {access.locked ? (access.tier === 'FREE' ? 'PRO Feature — Locked' : 'Limit Reached') : apiLoading ? 'Searching...' : 'Find Colleges'}
          </button>
        </div>
      </div>

      {/* Results */}
      <div style={{ marginTop: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
          <p className="section-label">
            {apiLoading
              ? 'Searching database...'
              : searched
                ? `${apiColleges.length} result${apiColleges.length !== 1 ? 's' : ''} for Rank #${rank}${category !== 'All' ? ` · ${category}` : ''}`
                : 'Enter your rank and click Find Colleges'}
          </p>
          {searched && apiColleges.length > 0 && (
            <button className="btn-secondary" onClick={exportPDF} style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <span className="material-icons" style={{ fontSize: '1.1rem' }}>picture_as_pdf</span>
              Download PDF
            </button>
          )}
        </div>

        {apiLoading && (
          <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
            <span className="material-icons" style={{ fontSize: '3rem', color: 'var(--primary)', display: 'block', marginBottom: '1rem', animation: 'spin 1s linear infinite' }}>refresh</span>
            <p>Querying database...</p>
          </div>
        )}

        {!apiLoading && searched && apiColleges.length === 0 && (
          <div className="empty-state card animate-in">
            <span className="material-icons empty-icon">search_off</span>
            <h3>No colleges match your filters</h3>
            <p>Try adjusting category, counselling type, or increasing rank range.</p>
          </div>
        )}

        {!apiLoading && apiColleges.length > 0 && (
          <div className="table-responsive animate-in">
            <table className="colleges-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th onClick={() => handleSort('name')} style={{ cursor: 'pointer' }}>
                    College Name {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('state')} style={{ cursor: 'pointer' }}>
                    State {sortConfig.key === 'state' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('type')} style={{ cursor: 'pointer' }}>
                    Type {sortConfig.key === 'type' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('category')} style={{ cursor: 'pointer' }}>
                    Category {sortConfig.key === 'category' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('quota')} style={{ cursor: 'pointer' }}>
                    Quota {sortConfig.key === 'quota' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('course_fee')} style={{ cursor: 'pointer' }}>
                    Fee {sortConfig.key === 'course_fee' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th>R1</th>
                  <th>R2</th>
                  <th>R3</th>
                  <th>R4</th>
                  <th>R5</th>
                </tr>
              </thead>
              <tbody>
                {sortedColleges.map((c, i) => {
                  const parseRank = str => {
                    if (!str) return null;
                    const v = parseInt(str.replace(/\D.*$/, ''), 10);
                    return isNaN(v) ? null : v;
                  };
                  const rankInt = Number(rank);
                  const isEligible = r => r && parseRank(r) >= rankInt;
                  
                  return (
                    <tr key={c.name + i} style={{ background: c.maxRank && c.maxRank >= rankInt ? 'rgba(74,222,128,0.04)' : undefined }}>
                      <td style={{ color: 'var(--on-surface-variant)', fontSize: '0.8rem' }}>{i + 1}</td>
                      <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{c.name}</td>
                      <td>{STATES_LIST.find(s => s.value === c.state)?.label || c.state}</td>
                      <td>
                        <span style={{ padding: '0.2rem 0.6rem', borderRadius: '1rem', fontSize: '0.75rem', background: c.type?.toLowerCase() === 'ug' ? '#4ade8022' : '#60a5fa22', color: c.type?.toLowerCase() === 'ug' ? '#4ade80' : '#60a5fa', textTransform: 'uppercase' }}>
                          {c.type}
                        </span>
                      </td>
                      <td>{c.category}</td>
                      <td>{c.quota || '-'}</td>
                      <td style={{ fontWeight: 600, color: 'var(--on-surface)' }}>{c.course_fee ? `₹${Number(c.course_fee).toLocaleString()}` : '-'}</td>
                      <td style={{ color: isEligible(c.rounds?.r1) ? '#4ade80' : 'inherit' }}>{c.rounds?.r1 || '-'}</td>
                      <td style={{ color: isEligible(c.rounds?.r2) ? '#4ade80' : 'inherit' }}>{c.rounds?.r2 || '-'}</td>
                      <td style={{ color: isEligible(c.rounds?.r3) ? '#4ade80' : 'inherit' }}>{c.rounds?.r3 || '-'}</td>
                      <td style={{ color: isEligible(c.rounds?.r4) ? '#4ade80' : 'inherit' }}>{c.rounds?.r4 || '-'}</td>
                      <td style={{ color: isEligible(c.rounds?.r5) ? '#4ade80' : 'inherit' }}>{c.rounds?.r5 || '-'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
