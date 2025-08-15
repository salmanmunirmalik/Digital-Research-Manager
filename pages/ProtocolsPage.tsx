
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  PlusIcon, 
  SearchIcon, 
  FilterIcon, 
  ShareIcon, 
  PencilIcon, 
  TrashIcon,
  EyeIcon,
  BookOpenIcon,
  ClockIcon,
  TagIcon,
  UserIcon,
  BuildingOfficeIcon
} from '../components/icons';
import { Lab } from '../types';

interface Protocol {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty_level: string;
  estimated_duration: number;
  materials: string[];
  content: string;
  safety_notes: string;
  tags: string[];
  lab_id: string;
  privacy_level: string;
  author_id: string;
  creator_name: string;
  lab_name: string;
  institution: string;
  share_count: number;
  created_at: string;
  updated_at: string;
}

interface ProtocolSharing {
  id: string;
  protocol_id: string;
  shared_with_user_id: string | null;
  shared_with_lab_id: string | null;
  permission_level: string;
  lab_name: string | null;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
}

const ProtocolsPage: React.FC = () => {
  const { user, token } = useAuth();
  const [protocols, setProtocols] = useState<Protocol[]>([]);
  const [labs, setLabs] = useState<Lab[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Comprehensive mock protocols data
  const mockProtocols: Protocol[] = [
    {
      id: '1',
      title: 'CRISPR-Cas9 Gene Editing Protocol',
      description: 'Complete protocol for CRISPR-Cas9 mediated gene editing in mammalian cells including guide RNA design, plasmid preparation, and transfection.',
      category: 'Molecular Biology',
      difficulty_level: 'advanced',
      estimated_duration: 48,
      materials: [
        'CRISPR-Cas9 plasmid',
        'Guide RNA oligos',
        'Lipofectamine 3000',
        'DMEM medium',
        'FBS',
        'Antibiotics',
        'PCR machine',
        'Gel electrophoresis equipment'
      ],
      content: `1. Design guide RNA using CRISPR design tools
2. Synthesize guide RNA oligos
3. Prepare CRISPR-Cas9 plasmid
4. Culture cells to 70-80% confluence
5. Transfect cells using Lipofectamine 3000
6. Incubate for 48-72 hours
7. Analyze editing efficiency by sequencing`,
      safety_notes: 'Work with BSL-2 precautions. Handle CRISPR components carefully. Dispose of materials according to institutional guidelines.',
      tags: ['CRISPR', 'Gene Editing', 'Molecular Biology', 'Transfection'],
      lab_id: 'lab-1',
      privacy_level: 'global',
      author_id: 'user-1',
      creator_name: 'Dr. Sarah Johnson',
      lab_name: 'Molecular Genetics Lab',
      institution: 'University Research Center',
      share_count: 45,
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-15T10:00:00Z'
    },
    {
      id: '2',
      title: 'Protein Extraction and Western Blotting',
      description: 'Standard protocol for protein extraction from cultured cells and tissues followed by SDS-PAGE and Western blotting for protein detection.',
      category: 'Protein Analysis',
      difficulty_level: 'intermediate',
      estimated_duration: 24,
      materials: [
        'RIPA buffer',
        'Protease inhibitors',
        'BCA protein assay kit',
        'SDS-PAGE gel',
        'Transfer buffer',
        'Primary antibodies',
        'Secondary antibodies',
        'ECL substrate'
      ],
      content: `1. Lyse cells in RIPA buffer with protease inhibitors
2. Centrifuge at 14,000g for 15 minutes
3. Quantify protein using BCA assay
4. Load equal amounts on SDS-PAGE gel
5. Run gel at 120V for 90 minutes
6. Transfer to PVDF membrane
7. Block with 5% milk for 1 hour
8. Incubate with primary antibody overnight
9. Wash and incubate with secondary antibody
10. Detect using ECL substrate`,
      safety_notes: 'Wear gloves and lab coat. Handle acrylamide carefully. Dispose of gels in designated containers.',
      tags: ['Protein Analysis', 'Western Blot', 'SDS-PAGE', 'Antibodies'],
      lab_id: 'lab-1',
      privacy_level: 'global',
      author_id: 'user-2',
      creator_name: 'Dr. Michael Chen',
      lab_name: 'Cell Biology Lab',
      institution: 'University Research Center',
      share_count: 32,
      created_at: '2024-01-10T14:30:00Z',
      updated_at: '2024-01-10T14:30:00Z'
    },
    {
      id: '3',
      title: 'Cell Culture and Maintenance',
      description: 'Comprehensive protocol for maintaining mammalian cell cultures including media preparation, passaging, and cryopreservation.',
      category: 'Cell Culture',
      difficulty_level: 'beginner',
      estimated_duration: 4,
      materials: [
        'DMEM/F12 medium',
        'Fetal bovine serum (FBS)',
        'Trypsin-EDTA solution',
        'PBS',
        'Cell culture flasks',
        'CO2 incubator',
        'Laminar flow hood',
        'Cryovials'
      ],
      content: `1. Prepare complete medium (DMEM/F12 + 10% FBS)
2. Warm medium to 37°C
3. Remove old medium from flask
4. Wash cells with PBS
5. Add trypsin-EDTA and incubate 3-5 minutes
6. Neutralize with complete medium
7. Centrifuge at 300g for 5 minutes
8. Resuspend in fresh medium
9. Split at appropriate ratio (1:3 to 1:10)
10. For cryopreservation, add DMSO to 10% final concentration`,
      safety_notes: 'Work in laminar flow hood. Use sterile technique. Handle human cells with appropriate precautions.',
      tags: ['Cell Culture', 'Passaging', 'Cryopreservation', 'Sterile Technique'],
      lab_id: 'lab-2',
      privacy_level: 'global',
      author_id: 'user-3',
      creator_name: 'Emily Rodriguez',
      lab_name: 'Cell Biology Lab',
      institution: 'University Research Center',
      share_count: 28,
      created_at: '2024-01-08T09:15:00Z',
      updated_at: '2024-01-08T09:15:00Z'
    },
    {
      id: '4',
      title: 'Real-Time PCR (qPCR) Protocol',
      description: 'Quantitative real-time PCR protocol for gene expression analysis including primer design, reaction setup, and data analysis.',
      category: 'Molecular Biology',
      difficulty_level: 'intermediate',
      estimated_duration: 6,
      materials: [
        'SYBR Green master mix',
        'Primers (forward and reverse)',
        'cDNA template',
        '96-well PCR plates',
        'Real-time PCR machine',
        'Optical adhesive film',
        'Centrifuge',
        'Vortex mixer'
      ],
      content: `1. Design primers using Primer3 or similar software
2. Prepare cDNA from RNA samples
3. Set up 20μL reactions in 96-well plate
4. Add 10μL SYBR Green master mix
5. Add 2μL of each primer (10μM)
6. Add 6μL cDNA template
7. Add 2μL nuclease-free water
8. Seal plate with optical film
9. Run PCR program: 95°C 10min, 40 cycles of 95°C 15s, 60°C 1min
10. Analyze data using ΔΔCt method`,
      safety_notes: 'Wear gloves. Avoid contamination between samples. Use filter tips for pipetting.',
      tags: ['qPCR', 'Gene Expression', 'Real-time PCR', 'Primer Design'],
      lab_id: 'lab-1',
      privacy_level: 'global',
      author_id: 'user-4',
      creator_name: 'Alex Thompson',
      lab_name: 'Molecular Genetics Lab',
      institution: 'University Research Center',
      share_count: 41,
      created_at: '2024-01-12T16:45:00Z',
      updated_at: '2024-01-12T16:45:00Z'
    },
    {
      id: '5',
      title: 'Immunofluorescence Staining',
      description: 'Protocol for immunofluorescence staining of fixed cells and tissues for protein localization studies.',
      category: 'Microscopy',
      difficulty_level: 'intermediate',
      estimated_duration: 8,
      materials: [
        'Paraformaldehyde (4%)',
        'Triton X-100',
        'Primary antibodies',
        'Fluorescent secondary antibodies',
        'DAPI or Hoechst stain',
        'Mounting medium',
        'Coverslips',
        'Confocal microscope'
      ],
      content: `1. Fix cells with 4% PFA for 15 minutes
2. Permeabilize with 0.1% Triton X-100 for 10 minutes
3. Block with 5% BSA for 1 hour
4. Incubate with primary antibody overnight at 4°C
5. Wash 3x with PBS
6. Incubate with fluorescent secondary antibody for 1 hour
7. Wash 3x with PBS
8. Stain nuclei with DAPI for 5 minutes
9. Mount with anti-fade mounting medium
10. Image using confocal microscope`,
      safety_notes: 'Work in dark room. Protect samples from light. Dispose of PFA properly.',
      tags: ['Immunofluorescence', 'Microscopy', 'Antibodies', 'Cell Staining'],
      lab_id: 'lab-2',
      privacy_level: 'global',
      author_id: 'user-2',
      creator_name: 'Dr. Michael Chen',
      lab_name: 'Cell Biology Lab',
      institution: 'University Research Center',
      share_count: 35,
      created_at: '2024-01-06T11:20:00Z',
      updated_at: '2024-01-06T11:20:00Z'
    },
    {
      id: '6',
      title: 'RNA Extraction and cDNA Synthesis',
      description: 'Total RNA extraction from cells and tissues followed by reverse transcription to cDNA for downstream applications.',
      category: 'Molecular Biology',
      difficulty_level: 'beginner',
      estimated_duration: 4,
      materials: [
        'TRIzol reagent',
        'Chloroform',
        'Isopropanol',
        '75% ethanol',
        'RNase-free water',
        'Reverse transcriptase',
        'Random primers',
        'dNTPs'
      ],
      content: `1. Lyse cells in TRIzol reagent
2. Add chloroform and shake vigorously
3. Centrifuge at 12,000g for 15 minutes
4. Transfer aqueous phase to new tube
5. Add isopropanol and incubate 10 minutes
6. Centrifuge at 12,000g for 10 minutes
7. Wash pellet with 75% ethanol
8. Air dry and resuspend in RNase-free water
9. For cDNA synthesis, add random primers and dNTPs
10. Add reverse transcriptase and incubate at 42°C for 1 hour`,
      safety_notes: 'Wear gloves. Work in RNase-free environment. Handle TRIzol carefully.',
      tags: ['RNA Extraction', 'TRIzol', 'cDNA Synthesis', 'Reverse Transcription'],
      lab_id: 'lab-1',
      privacy_level: 'global',
      author_id: 'user-1',
      creator_name: 'Dr. Sarah Johnson',
      lab_name: 'Molecular Genetics Lab',
      institution: 'University Research Center',
      share_count: 38,
      created_at: '2024-01-14T13:10:00Z',
      updated_at: '2024-01-14T13:10:00Z'
    },
    {
      id: '7',
      title: 'Flow Cytometry Analysis',
      description: 'Protocol for flow cytometry analysis of cell populations including staining, data acquisition, and analysis.',
      category: 'Flow Cytometry',
      difficulty_level: 'advanced',
      estimated_duration: 6,
      materials: [
        'Fluorescent antibodies',
        'Fixation buffer',
        'Permeabilization buffer',
        'Flow cytometry tubes',
        'Flow cytometer',
        'Compensation beads',
        'FCS Express software',
        'Viability dye'
      ],
      content: `1. Stain cells with fluorescent antibodies
2. Fix cells with 4% PFA if needed
3. Permeabilize if staining intracellular proteins
4. Add viability dye to exclude dead cells
5. Set up compensation using single-stained controls
6. Acquire data on flow cytometer
7. Set appropriate gates for analysis
8. Export data as FCS files
9. Analyze using FlowJo or FCS Express
10. Generate plots and statistics`,
      safety_notes: 'Wear appropriate PPE. Handle potentially infectious samples safely. Calibrate instrument regularly.',
      tags: ['Flow Cytometry', 'Cell Analysis', 'Fluorescent Staining', 'Data Analysis'],
      lab_id: 'lab-3',
      privacy_level: 'global',
      author_id: 'user-5',
      creator_name: 'Dr. Lisa Wang',
      lab_name: 'Immunology Lab',
      institution: 'University Research Center',
      share_count: 29,
      created_at: '2024-01-11T15:30:00Z',
      updated_at: '2024-01-11T15:30:00Z'
    },
    {
      id: '8',
      title: 'Enzyme-Linked Immunosorbent Assay (ELISA)',
      description: 'Standard ELISA protocol for detecting and quantifying proteins, antibodies, or antigens in biological samples.',
      category: 'Immunoassays',
      difficulty_level: 'intermediate',
      estimated_duration: 8,
      materials: [
        '96-well ELISA plates',
        'Capture antibody',
        'Detection antibody',
        'Enzyme conjugate',
        'Substrate solution',
        'Stop solution',
        'Plate reader',
        'Wash buffer'
      ],
      content: `1. Coat plate with capture antibody overnight at 4°C
2. Block with 5% BSA for 2 hours
3. Add standards and samples, incubate 2 hours
4. Wash 3x with wash buffer
5. Add detection antibody, incubate 2 hours
6. Wash 3x with wash buffer
7. Add enzyme conjugate, incubate 1 hour
8. Wash 3x with wash buffer
9. Add substrate, incubate 15-30 minutes
10. Stop reaction and read absorbance`,
      safety_notes: 'Wear gloves. Avoid cross-contamination. Use fresh reagents.',
      tags: ['ELISA', 'Immunoassay', 'Protein Detection', 'Antibodies'],
      lab_id: 'lab-2',
      privacy_level: 'global',
      author_id: 'user-3',
      creator_name: 'Emily Rodriguez',
      lab_name: 'Cell Biology Lab',
      institution: 'University Research Center',
      share_count: 33,
      created_at: '2024-01-09T10:45:00Z',
      updated_at: '2024-01-09T10:45:00Z'
    },
    {
      id: '9',
      title: 'Mass Spectrometry Sample Preparation',
      description: 'Protocol for preparing biological samples for mass spectrometry analysis including protein digestion and peptide purification.',
      category: 'Proteomics',
      difficulty_level: 'advanced',
      estimated_duration: 24,
      materials: [
        'Trypsin',
        'Urea',
        'DTT',
        'Iodoacetamide',
        'C18 spin columns',
        'Formic acid',
        'Acetonitrile',
        'Mass spectrometer'
      ],
      content: `1. Reduce proteins with DTT at 56°C for 1 hour
2. Alkylate with iodoacetamide for 30 minutes
3. Digest with trypsin overnight at 37°C
4. Acidify with formic acid to pH <3
5. Desalt using C18 spin columns
6. Elute peptides with acetonitrile
7. Dry samples in vacuum centrifuge
8. Resuspend in 0.1% formic acid
9. Analyze by LC-MS/MS
10. Process data using MaxQuant or similar software`,
      safety_notes: 'Work in fume hood. Handle organic solvents carefully. Use appropriate waste disposal.',
      tags: ['Mass Spectrometry', 'Proteomics', 'Protein Digestion', 'Peptide Analysis'],
      lab_id: 'lab-4',
      privacy_level: 'global',
      author_id: 'user-6',
      creator_name: 'Dr. James Wilson',
      lab_name: 'Proteomics Core Facility',
      institution: 'University Research Center',
      share_count: 26,
      created_at: '2024-01-13T12:00:00Z',
      updated_at: '2024-01-13T12:00:00Z'
    },
    {
      id: '10',
      title: 'Next-Generation Sequencing Library Preparation',
      description: 'Protocol for preparing DNA/RNA libraries for next-generation sequencing including fragmentation, adapter ligation, and PCR amplification.',
      category: 'Genomics',
      difficulty_level: 'advanced',
      estimated_duration: 36,
      materials: [
        'DNA/RNA fragmentation kit',
        'Library preparation kit',
        'Magnetic beads',
        'PCR reagents',
        'Adapter oligos',
        'Index primers',
        'Qubit fluorometer',
        'Bioanalyzer'
      ],
      content: `1. Fragment DNA/RNA to appropriate size
2. End-repair DNA fragments
3. Add A-tails to 3' ends
4. Ligate sequencing adapters
5. Clean up using magnetic beads
6. Amplify library by PCR
7. Add unique index sequences
8. Clean up final library
9. Quantify using Qubit
10. Check size distribution on Bioanalyzer`,
      safety_notes: 'Work in clean environment. Avoid contamination. Use filter tips throughout.',
      tags: ['NGS', 'Library Preparation', 'Sequencing', 'Genomics'],
      lab_id: 'lab-5',
      privacy_level: 'global',
      author_id: 'user-7',
      creator_name: 'Dr. Maria Garcia',
      lab_name: 'Genomics Core Facility',
      institution: 'University Research Center',
      share_count: 31,
      created_at: '2024-01-07T14:15:00Z',
      updated_at: '2024-01-07T14:15:00Z'
    },
    {
      id: '11',
      title: 'Cell Migration Assay (Scratch Wound)',
      description: 'In vitro scratch wound assay to study cell migration and wound healing in cultured cells.',
      category: 'Cell Biology',
      difficulty_level: 'beginner',
      estimated_duration: 48,
      materials: [
        '6-well culture plates',
        '200μL pipette tips',
        'Phase contrast microscope',
        'Image analysis software',
        'Cell culture medium',
        'PBS',
        'Trypsin-EDTA',
        'Hemocytometer'
      ],
      content: `1. Seed cells in 6-well plates to 90% confluence
2. Create scratch wounds using 200μL pipette tips
3. Wash wells with PBS to remove debris
4. Add fresh medium
5. Take initial images at 0 hours
6. Incubate at 37°C with 5% CO2
7. Take images at 6, 12, 24, and 48 hours
8. Measure wound area using ImageJ
9. Calculate migration rate
10. Analyze data statistically`,
      safety_notes: 'Work in sterile conditions. Handle cells carefully. Use appropriate waste disposal.',
      tags: ['Cell Migration', 'Scratch Assay', 'Wound Healing', 'Cell Biology'],
      lab_id: 'lab-2',
      privacy_level: 'global',
      author_id: 'user-3',
      creator_name: 'Emily Rodriguez',
      lab_name: 'Cell Biology Lab',
      institution: 'University Research Center',
      share_count: 24,
      created_at: '2024-01-05T09:30:00Z',
      updated_at: '2024-01-05T09:30:00Z'
    },
    {
      id: '12',
      title: 'High-Performance Liquid Chromatography (HPLC)',
      description: 'Protocol for HPLC analysis of small molecules, peptides, and proteins including sample preparation and method development.',
      category: 'Analytical Chemistry',
      difficulty_level: 'advanced',
      estimated_duration: 12,
      materials: [
        'HPLC system',
        'C18 column',
        'Mobile phase solvents',
        'Sample vials',
        'Syringe filters',
        'Standards',
        'Data analysis software',
        'Column oven'
      ],
      content: `1. Prepare mobile phase (e.g., water:acetonitrile gradient)
2. Equilibrate column for 30 minutes
3. Prepare samples in appropriate solvent
4. Filter samples through 0.22μm syringe filters
5. Set injection volume and flow rate
6. Run method with appropriate gradient
7. Monitor UV absorbance at suitable wavelength
8. Collect fractions if needed
9. Analyze data using chromatography software
10. Calculate retention times and peak areas`,
      safety_notes: 'Wear safety glasses. Handle organic solvents in fume hood. Dispose of waste properly.',
      tags: ['HPLC', 'Chromatography', 'Analytical Chemistry', 'Method Development'],
      lab_id: 'lab-6',
      privacy_level: 'global',
      author_id: 'user-8',
      creator_name: 'Dr. Robert Chen',
      lab_name: 'Analytical Chemistry Lab',
      institution: 'University Research Center',
      share_count: 27,
      created_at: '2024-01-04T16:20:00Z',
      updated_at: '2024-01-04T16:20:00Z'
    }
  ];
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedProtocol, setSelectedProtocol] = useState<Protocol | null>(null);
  const [selectedProtocolDetails, setSelectedProtocolDetails] = useState<{ protocol: Protocol; sharing: ProtocolSharing[] } | null>(null);

  // Filter states
  const [filters, setFilters] = useState({
    lab_id: '',
    category: '',
    difficulty: '',
    search: '',
    privacy: ''
  });

  // Form states
  const [protocolForm, setProtocolForm] = useState({
    title: '',
    description: '',
    category: '',
    difficulty_level: 'beginner',
    estimated_duration: 1,
    materials: [''],
    content: '',
    safety_notes: '',
    tags: [''],
    lab_id: '',
    privacy_level: 'lab'
  });

  const [shareForm, setShareForm] = useState({
    shared_with_user_id: '',
    shared_with_lab_id: '',
    permission_level: 'read'
  });

  useEffect(() => {
    // Use mock data instead of API calls
    setProtocols(mockProtocols);
    setLabs([
      { id: 'lab-1', name: 'Molecular Genetics Lab', institution: 'University Research Center', department: 'Biology' },
      { id: 'lab-2', name: 'Cell Biology Lab', institution: 'University Research Center', department: 'Biology' },
      { id: 'lab-3', name: 'Immunology Lab', institution: 'University Research Center', department: 'Immunology' },
      { id: 'lab-4', name: 'Proteomics Core Facility', institution: 'University Research Center', department: 'Biochemistry' },
      { id: 'lab-5', name: 'Genomics Core Facility', institution: 'University Research Center', department: 'Genetics' },
      { id: 'lab-6', name: 'Analytical Chemistry Lab', institution: 'University Research Center', department: 'Chemistry' }
    ]);
    setCategories(['Molecular Biology', 'Protein Analysis', 'Cell Culture', 'Microscopy', 'Flow Cytometry', 'Immunoassays', 'Proteomics', 'Genomics', 'Cell Biology', 'Analytical Chemistry']);
    setIsLoading(false);
  }, []);

  // Filter protocols based on current filters
  const filteredProtocols = mockProtocols.filter(protocol => {
    if (filters.search && !protocol.title.toLowerCase().includes(filters.search.toLowerCase()) && 
        !protocol.description.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    if (filters.lab_id && protocol.lab_id !== filters.lab_id) {
      return false;
    }
    if (filters.category && protocol.category !== filters.category) {
      return false;
    }
    if (filters.difficulty && protocol.difficulty_level !== filters.difficulty) {
      return false;
    }
    if (filters.privacy && protocol.privacy_level !== filters.privacy) {
      return false;
    }
    return true;
  });

  const fetchProtocols = async () => {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });

      const response = await fetch(`http://localhost:5001/api/protocols?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setProtocols(data.protocols);
      } else {
        setError('Failed to fetch protocols');
      }
    } catch (error) {
      setError('Error fetching protocols');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLabs = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/labs', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setLabs(data.labs);
      }
    } catch (error) {
      console.error('Error fetching labs:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/protocols/categories', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchProtocolDetails = async (protocolId: string) => {
    try {
      const response = await fetch(`http://localhost:5001/api/protocols/${protocolId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedProtocolDetails(data);
      }
    } catch (error) {
      setError('Error fetching protocol details');
    }
  };

  const handleCreateProtocol = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5001/api/protocols', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...protocolForm,
          materials: protocolForm.materials.filter(m => m.trim()),
          tags: protocolForm.tags.filter(t => t.trim())
        })
      });

      if (response.ok) {
        setShowCreateModal(false);
        setProtocolForm({
          title: '',
          description: '',
          category: '',
          difficulty_level: 'beginner',
          estimated_duration: 1,
          materials: [''],
          content: '',
          safety_notes: '',
          tags: [''],
          lab_id: '',
          privacy_level: 'lab'
        });
        fetchProtocols();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to create protocol');
      }
    } catch (error) {
      setError('Error creating protocol');
    }
  };

  const handleUpdateProtocol = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProtocol) return;

    try {
      const response = await fetch(`http://localhost:5001/api/protocols/${selectedProtocol.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...protocolForm,
          materials: protocolForm.materials.filter(m => m.trim()),
          tags: protocolForm.tags.filter(t => t.trim())
        })
      });

      if (response.ok) {
        setShowEditModal(false);
        fetchProtocols();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update protocol');
      }
    } catch (error) {
      setError('Error updating protocol');
    }
  };

  const handleDeleteProtocol = async (protocolId: string) => {
    if (!confirm('Are you sure you want to delete this protocol?')) return;

    try {
      const response = await fetch(`http://localhost:5001/api/protocols/${protocolId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        fetchProtocols();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to delete protocol');
      }
    } catch (error) {
      setError('Error deleting protocol');
    }
  };

  const handleShareProtocol = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProtocol) return;

    try {
      const response = await fetch(`http://localhost:5001/api/protocols/${selectedProtocol.id}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(shareForm)
      });

      if (response.ok) {
        setShowShareModal(false);
        setShareForm({
          shared_with_user_id: '',
          shared_with_lab_id: '',
          permission_level: 'read'
        });
        fetchProtocolDetails(selectedProtocol.id);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to share protocol');
      }
    } catch (error) {
      setError('Error sharing protocol');
    }
  };

  const openEditModal = (protocol: Protocol) => {
    setSelectedProtocol(protocol);
    setProtocolForm({
      title: protocol.title,
      description: protocol.description || '',
      category: protocol.category || '',
      difficulty_level: protocol.difficulty_level || 'beginner',
      estimated_duration: protocol.estimated_duration || 1,
      materials: protocol.materials?.length ? protocol.materials : [''],
      content: protocol.content,
      safety_notes: protocol.safety_notes || '',
      tags: protocol.tags?.length ? protocol.tags : [''],
      lab_id: protocol.lab_id || '',
      privacy_level: protocol.privacy_level || 'lab'
    });
    setShowEditModal(true);
  };

  const openShareModal = (protocol: Protocol) => {
    setSelectedProtocol(protocol);
    setShowShareModal(true);
  };

  const openViewModal = (protocol: Protocol) => {
    setSelectedProtocol(protocol);
    fetchProtocolDetails(protocol.id);
    setShowViewModal(true);
  };

  const canEditProtocol = (protocol: Protocol) => {
    if (user?.role === 'admin') return true;
    if (protocol.author_id === user?.id) return true;
    // Lab PI can also edit
    return false; // TODO: Implement lab PI check
  };

  const addArrayItem = (field: 'materials' | 'tags') => {
    setProtocolForm(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const removeArrayItem = (field: 'materials' | 'tags', index: number) => {
    setProtocolForm(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const updateArrayItem = (field: 'materials' | 'tags', index: number, value: string) => {
    setProtocolForm(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Research Protocols</h1>
          <p className="text-gray-600">Create, manage, and share research protocols</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 flex items-center space-x-2"
        >
          <PlusIcon className="w-5 h-5" />
          <span>Create Protocol</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      {/* Protocols Count */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <BookOpenIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-blue-900">Protocol Library</h3>
              <p className="text-blue-700">
                {filteredProtocols.length} of {mockProtocols.length} protocols available
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-blue-900">{mockProtocols.length}</p>
            <p className="text-sm text-blue-700">Total Protocols</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-4 mb-4">
          <FilterIcon className="w-5 h-5 text-gray-500" />
          <h3 className="font-medium text-gray-900">Filters</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search protocols..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Lab</label>
            <select
              value={filters.lab_id}
              onChange={(e) => setFilters({ ...filters, lab_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Labs</option>
              {labs.map(lab => (
                <option key={lab.id} value={lab.id}>{lab.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
            <select
              value={filters.difficulty}
              onChange={(e) => setFilters({ ...filters, difficulty: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Levels</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Privacy</label>
            <select
              value={filters.privacy}
              onChange={(e) => setFilters({ ...filters, privacy: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Privacy Levels</option>
              <option value="personal">Personal</option>
              <option value="lab">Lab</option>
              <option value="global">Global</option>
            </select>
          </div>
        </div>
      </div>

      {/* Protocols Overview */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Protocol Categories Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { name: 'Molecular Biology', count: mockProtocols.filter(p => p.category === 'Molecular Biology').length, color: 'from-blue-500 to-blue-600' },
            { name: 'Cell Biology', count: mockProtocols.filter(p => p.category === 'Cell Biology').length, color: 'from-green-500 to-green-600' },
            { name: 'Protein Analysis', count: mockProtocols.filter(p => p.category === 'Protein Analysis').length, color: 'from-purple-500 to-purple-600' },
            { name: 'Microscopy', count: mockProtocols.filter(p => p.category === 'Microscopy').length, color: 'from-orange-500 to-orange-600' },
            { name: 'Advanced Techniques', count: mockProtocols.filter(p => ['Proteomics', 'Genomics', 'Flow Cytometry', 'Analytical Chemistry'].includes(p.category)).length, color: 'from-red-500 to-red-600' }
          ].map((category) => (
            <div key={category.name} className={`bg-gradient-to-r ${category.color} text-white p-4 rounded-lg text-center`}>
              <p className="text-2xl font-bold">{category.count}</p>
              <p className="text-sm opacity-90">{category.name}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Protocols Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProtocols.map((protocol) => (
          <div key={protocol.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                <BookOpenIcon className="w-6 h-6 text-white" />
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => openViewModal(protocol)}
                  className="text-gray-400 hover:text-gray-600"
                  title="View Details"
                >
                  <EyeIcon className="w-4 h-4" />
                </button>
                {canEditProtocol(protocol) && (
                  <>
                    <button
                      onClick={() => openEditModal(protocol)}
                      className="text-gray-400 hover:text-gray-600"
                      title="Edit Protocol"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteProtocol(protocol.id)}
                      className="text-red-400 hover:text-red-600"
                      title="Delete Protocol"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </>
                )}
                <button
                  onClick={() => openShareModal(protocol)}
                  className="text-blue-400 hover:text-blue-600"
                  title="Share Protocol"
                >
                  <ShareIcon className="w-4 h-4" />
                </button>
              </div>
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mb-2">{protocol.title}</h3>
            <p className="text-gray-600 text-sm mb-3 line-clamp-2">{protocol.description}</p>

            <div className="space-y-2 text-sm text-gray-600 mb-4">
              <div className="flex items-center space-x-2">
                <BuildingOfficeIcon className="w-4 h-4" />
                <span>{protocol.lab_name}</span>
              </div>
              <div className="flex items-center space-x-2">
                <UserIcon className="w-4 h-4" />
                <span>{protocol.creator_name}</span>
              </div>
              <div className="flex items-center space-x-2">
                <ClockIcon className="w-4 h-4" />
                <span>{protocol.estimated_duration} hour{protocol.estimated_duration !== 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-center space-x-2">
                <TagIcon className="w-4 h-4" />
                <span className="capitalize">{protocol.difficulty_level}</span>
              </div>
            </div>

            {protocol.tags && protocol.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {protocol.tags.map((tag, index) => (
                  <span key={index} className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <span className="text-xs text-gray-500">
                {new Date(protocol.created_at).toLocaleDateString()}
              </span>
              <span className="text-xs text-gray-500">
                {protocol.share_count} share{protocol.share_count !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        ))}
      </div>

      {filteredProtocols.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <BookOpenIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No protocols found</h3>
          <p className="text-gray-600">Create your first protocol to get started.</p>
        </div>
      )}

      {/* Create Protocol Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Create New Protocol</h2>
            <form onSubmit={handleCreateProtocol} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                  <input
                    type="text"
                    value={protocolForm.title}
                    onChange={(e) => setProtocolForm({ ...protocolForm, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <input
                    type="text"
                    value={protocolForm.category}
                    onChange={(e) => setProtocolForm({ ...protocolForm, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={protocolForm.description}
                  onChange={(e) => setProtocolForm({ ...protocolForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty Level</label>
                  <select
                    value={protocolForm.difficulty_level}
                    onChange={(e) => setProtocolForm({ ...protocolForm, difficulty_level: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration (hours)</label>
                  <input
                    type="number"
                    min="1"
                    value={protocolForm.estimated_duration}
                    onChange={(e) => setProtocolForm({ ...protocolForm, estimated_duration: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lab</label>
                  <select
                    value={protocolForm.lab_id}
                    onChange={(e) => setProtocolForm({ ...protocolForm, lab_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select Lab</option>
                    {labs.map(lab => (
                      <option key={lab.id} value={lab.id}>{lab.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Content *</label>
                <textarea
                  value={protocolForm.content}
                  onChange={(e) => setProtocolForm({ ...protocolForm, content: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={6}
                  placeholder="Enter the step-by-step protocol content..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Materials</label>
                {protocolForm.materials.map((material, index) => (
                  <div key={index} className="flex space-x-2 mb-2">
                    <input
                      type="text"
                      value={material}
                      onChange={(e) => updateArrayItem('materials', index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Material name"
                    />
                    {protocolForm.materials.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeArrayItem('materials', index)}
                        className="px-3 py-2 text-red-600 hover:text-red-700"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addArrayItem('materials')}
                  className="text-blue-600 hover:text-blue-700 text-sm"
                >
                  + Add Material
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Safety Notes</label>
                <textarea
                  value={protocolForm.safety_notes}
                  onChange={(e) => setProtocolForm({ ...protocolForm, safety_notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Important safety considerations..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                {protocolForm.tags.map((tag, index) => (
                  <div key={index} className="flex space-x-2 mb-2">
                    <input
                      type="text"
                      value={tag}
                      onChange={(e) => updateArrayItem('tags', index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Tag name"
                    />
                    {protocolForm.tags.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeArrayItem('tags', index)}
                        className="px-3 py-2 text-red-600 hover:text-red-700"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addArrayItem('tags')}
                  className="text-blue-600 hover:text-blue-700 text-sm"
                >
                  + Add Tag
                </button>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Create Protocol
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Protocol Modal */}
      {showEditModal && selectedProtocol && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Edit Protocol</h2>
            <form onSubmit={handleUpdateProtocol} className="space-y-4">
              {/* Same form fields as create, but with protocolForm values */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                  <input
                    type="text"
                    value={protocolForm.title}
                    onChange={(e) => setProtocolForm({ ...protocolForm, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <input
                    type="text"
                    value={protocolForm.category}
                    onChange={(e) => setProtocolForm({ ...protocolForm, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={protocolForm.description}
                  onChange={(e) => setProtocolForm({ ...protocolForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty Level</label>
                  <select
                    value={protocolForm.difficulty_level}
                    onChange={(e) => setProtocolForm({ ...protocolForm, difficulty_level: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration (hours)</label>
                  <input
                    type="number"
                    min="1"
                    value={protocolForm.estimated_duration}
                    onChange={(e) => setProtocolForm({ ...protocolForm, estimated_duration: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lab</label>
                  <select
                    value={protocolForm.lab_id}
                    onChange={(e) => setProtocolForm({ ...protocolForm, lab_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select Lab</option>
                    {labs.map(lab => (
                      <option key={lab.id} value={lab.id}>{lab.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Content *</label>
                <textarea
                  value={protocolForm.content}
                  onChange={(e) => setProtocolForm({ ...protocolForm, content: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={6}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Materials</label>
                {protocolForm.materials.map((material, index) => (
                  <div key={index} className="flex space-x-2 mb-2">
                    <input
                      type="text"
                      value={material}
                      onChange={(e) => updateArrayItem('materials', index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {protocolForm.materials.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeArrayItem('materials', index)}
                        className="px-3 py-2 text-red-600 hover:text-red-700"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addArrayItem('materials')}
                  className="text-blue-600 hover:text-blue-700 text-sm"
                >
                  + Add Material
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Safety Notes</label>
                <textarea
                  value={protocolForm.safety_notes}
                  onChange={(e) => setProtocolForm({ ...protocolForm, safety_notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                {protocolForm.tags.map((tag, index) => (
                  <div key={index} className="flex space-x-2 mb-2">
                    <input
                      type="text"
                      value={tag}
                      onChange={(e) => updateArrayItem('tags', index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {protocolForm.tags.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeArrayItem('tags', index)}
                        className="px-3 py-2 text-red-600 hover:text-red-700"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addArrayItem('tags')}
                  className="text-blue-600 hover:text-blue-700 text-sm"
                >
                  + Add Tag
                </button>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Update Protocol
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Share Protocol Modal */}
      {showShareModal && selectedProtocol && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Share Protocol</h2>
            <form onSubmit={handleShareProtocol} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Share with Lab</label>
                <select
                  value={shareForm.shared_with_lab_id}
                  onChange={(e) => setShareForm({ ...shareForm, shared_with_lab_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Lab</option>
                  {labs.map(lab => (
                    <option key={lab.id} value={lab.id}>{lab.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Permission Level</label>
                <select
                  value={shareForm.permission_level}
                  onChange={(e) => setShareForm({ ...shareForm, permission_level: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="read">Read Only</option>
                  <option value="comment">Comment</option>
                  <option value="edit">Edit</option>
                  <option value="full_access">Full Access</option>
                </select>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowShareModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Share Protocol
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Protocol Modal */}
      {showViewModal && selectedProtocol && selectedProtocolDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">{selectedProtocol.title}</h2>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Description</h3>
                  <p className="text-gray-600">{selectedProtocol.description}</p>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Protocol Steps</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <pre className="whitespace-pre-wrap text-sm text-gray-700">{selectedProtocol.content}</pre>
                  </div>
                </div>

                {selectedProtocol.materials && selectedProtocol.materials.length > 0 && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Materials</h3>
                    <ul className="list-disc list-inside space-y-1 text-gray-600">
                      {selectedProtocol.materials.map((material, index) => (
                        <li key={index}>{material}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {selectedProtocol.safety_notes && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Safety Notes</h3>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <p className="text-yellow-800">{selectedProtocol.safety_notes}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-3">Protocol Details</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Category:</span>
                      <span className="font-medium">{selectedProtocol.category}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Difficulty:</span>
                      <span className="font-medium capitalize">{selectedProtocol.difficulty_level}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Duration:</span>
                      <span className="font-medium">{selectedProtocol.estimated_duration} hour{selectedProtocol.estimated_duration !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Privacy:</span>
                      <span className="font-medium capitalize">{selectedProtocol.privacy_level}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Created:</span>
                      <span className="font-medium">{new Date(selectedProtocol.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {selectedProtocol.tags && selectedProtocol.tags.length > 0 && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedProtocol.tags.map((tag, index) => (
                        <span key={index} className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Sharing</h3>
                  <div className="space-y-2">
                    {selectedProtocolDetails.sharing.map((share) => (
                      <div key={share.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm text-gray-600">
                          {share.lab_name || `${share.first_name} ${share.last_name}`}
                        </span>
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full capitalize">
                          {share.permission_level}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProtocolsPage;
