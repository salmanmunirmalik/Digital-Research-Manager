// University Email Validation Service
// Validates that lab creators have official university email addresses

export interface UniversityDomain {
  domain: string;
  institution: string;
  country: string;
  verified: boolean;
}

export class UniversityEmailValidator {
  private static universityDomains: UniversityDomain[] = [
    // Major US Universities
    { domain: 'harvard.edu', institution: 'Harvard University', country: 'USA', verified: true },
    { domain: 'mit.edu', institution: 'Massachusetts Institute of Technology', country: 'USA', verified: true },
    { domain: 'stanford.edu', institution: 'Stanford University', country: 'USA', verified: true },
    { domain: 'berkeley.edu', institution: 'University of California, Berkeley', country: 'USA', verified: true },
    { domain: 'caltech.edu', institution: 'California Institute of Technology', country: 'USA', verified: true },
    { domain: 'yale.edu', institution: 'Yale University', country: 'USA', verified: true },
    { domain: 'princeton.edu', institution: 'Princeton University', country: 'USA', verified: true },
    { domain: 'columbia.edu', institution: 'Columbia University', country: 'USA', verified: true },
    { domain: 'cornell.edu', institution: 'Cornell University', country: 'USA', verified: true },
    { domain: 'upenn.edu', institution: 'University of Pennsylvania', country: 'USA', verified: true },
    { domain: 'duke.edu', institution: 'Duke University', country: 'USA', verified: true },
    { domain: 'jhu.edu', institution: 'Johns Hopkins University', country: 'USA', verified: true },
    { domain: 'northwestern.edu', institution: 'Northwestern University', country: 'USA', verified: true },
    { domain: 'uchicago.edu', institution: 'University of Chicago', country: 'USA', verified: true },
    { domain: 'umich.edu', institution: 'University of Michigan', country: 'USA', verified: true },
    { domain: 'ucla.edu', institution: 'University of California, Los Angeles', country: 'USA', verified: true },
    { domain: 'ucsd.edu', institution: 'University of California, San Diego', country: 'USA', verified: true },
    { domain: 'wisc.edu', institution: 'University of Wisconsin-Madison', country: 'USA', verified: true },
    { domain: 'utexas.edu', institution: 'University of Texas at Austin', country: 'USA', verified: true },
    { domain: 'gatech.edu', institution: 'Georgia Institute of Technology', country: 'USA', verified: true },
    
    // International Universities
    { domain: 'cam.ac.uk', institution: 'University of Cambridge', country: 'UK', verified: true },
    { domain: 'ox.ac.uk', institution: 'University of Oxford', country: 'UK', verified: true },
    { domain: 'imperial.ac.uk', institution: 'Imperial College London', country: 'UK', verified: true },
    { domain: 'ucl.ac.uk', institution: 'University College London', country: 'UK', verified: true },
    { domain: 'ethz.ch', institution: 'ETH Zurich', country: 'Switzerland', verified: true },
    { domain: 'epfl.ch', institution: 'École Polytechnique Fédérale de Lausanne', country: 'Switzerland', verified: true },
    { domain: 'utoronto.ca', institution: 'University of Toronto', country: 'Canada', verified: true },
    { domain: 'ubc.ca', institution: 'University of British Columbia', country: 'Canada', verified: true },
    { domain: 'mcgill.ca', institution: 'McGill University', country: 'Canada', verified: true },
    { domain: 'unimelb.edu.au', institution: 'University of Melbourne', country: 'Australia', verified: true },
    { domain: 'sydney.edu.au', institution: 'University of Sydney', country: 'Australia', verified: true },
    { domain: 'anu.edu.au', institution: 'Australian National University', country: 'Australia', verified: true },
    { domain: 'nus.edu.sg', institution: 'National University of Singapore', country: 'Singapore', verified: true },
    { domain: 'ntu.edu.sg', institution: 'Nanyang Technological University', country: 'Singapore', verified: true },
    { domain: 'hku.hk', institution: 'University of Hong Kong', country: 'Hong Kong', verified: true },
    { domain: 'ust.hk', institution: 'Hong Kong University of Science and Technology', country: 'Hong Kong', verified: true },
    { domain: 'tsinghua.edu.cn', institution: 'Tsinghua University', country: 'China', verified: true },
    { domain: 'pku.edu.cn', institution: 'Peking University', country: 'China', verified: true },
    { domain: 'fudan.edu.cn', institution: 'Fudan University', country: 'China', verified: true },
    { domain: 'sjtu.edu.cn', institution: 'Shanghai Jiao Tong University', country: 'China', verified: true },
    { domain: 'u-tokyo.ac.jp', institution: 'University of Tokyo', country: 'Japan', verified: true },
    { domain: 'kyoto-u.ac.jp', institution: 'Kyoto University', country: 'Japan', verified: true },
    { domain: 'kaist.ac.kr', institution: 'Korea Advanced Institute of Science and Technology', country: 'South Korea', verified: true },
    { domain: 'snu.ac.kr', institution: 'Seoul National University', country: 'South Korea', verified: true },
    
    // Research Institutions
    { domain: 'nih.gov', institution: 'National Institutes of Health', country: 'USA', verified: true },
    { domain: 'nsf.gov', institution: 'National Science Foundation', country: 'USA', verified: true },
    { domain: 'cern.ch', institution: 'CERN', country: 'Switzerland', verified: true },
    { domain: 'maxplanck.de', institution: 'Max Planck Society', country: 'Germany', verified: true },
    { domain: 'cnrs.fr', institution: 'Centre National de la Recherche Scientifique', country: 'France', verified: true },
    { domain: 'csic.es', institution: 'Consejo Superior de Investigaciones Científicas', country: 'Spain', verified: true },
    
    // Generic patterns for common university domains
    { domain: '.edu', institution: 'US Educational Institution', country: 'USA', verified: false },
    { domain: '.ac.uk', institution: 'UK Academic Institution', country: 'UK', verified: false },
    { domain: '.edu.au', institution: 'Australian Educational Institution', country: 'Australia', verified: false },
    { domain: '.ac.ca', institution: 'Canadian Academic Institution', country: 'Canada', verified: false },
    { domain: '.edu.cn', institution: 'Chinese Educational Institution', country: 'China', verified: false },
    { domain: '.ac.jp', institution: 'Japanese Academic Institution', country: 'Japan', verified: false },
    { domain: '.ac.kr', institution: 'Korean Academic Institution', country: 'South Korea', verified: false },
    { domain: '.edu.sg', institution: 'Singapore Educational Institution', country: 'Singapore', verified: false },
    { domain: '.edu.hk', institution: 'Hong Kong Educational Institution', country: 'Hong Kong', verified: false },
  ];

  /**
   * Validates if an email address belongs to a recognized university domain
   */
  static validateUniversityEmail(email: string): {
    isValid: boolean;
    institution?: string;
    country?: string;
    domain?: string;
    verified: boolean;
  } {
    if (!email || !email.includes('@')) {
      return { isValid: false, verified: false };
    }

    const domain = email.split('@')[1].toLowerCase();
    
    // Check for exact domain matches first
    for (const universityDomain of this.universityDomains) {
      if (domain === universityDomain.domain) {
        return {
          isValid: true,
          institution: universityDomain.institution,
          country: universityDomain.country,
          domain: universityDomain.domain,
          verified: universityDomain.verified
        };
      }
    }

    // Check for pattern matches (like .edu, .ac.uk, etc.)
    for (const universityDomain of this.universityDomains) {
      if (domain.endsWith(universityDomain.domain) && !universityDomain.verified) {
        return {
          isValid: true,
          institution: universityDomain.institution,
          country: universityDomain.country,
          domain: universityDomain.domain,
          verified: false
        };
      }
    }

    return { isValid: false, verified: false };
  }

  /**
   * Gets all supported university domains
   */
  static getSupportedDomains(): UniversityDomain[] {
    return this.universityDomains.filter(d => d.verified);
  }

  /**
   * Checks if a domain is a verified university domain
   */
  static isVerifiedDomain(domain: string): boolean {
    const validation = this.validateUniversityEmail(`test@${domain}`);
    return validation.isValid && validation.verified;
  }

  /**
   * Suggests similar university domains for typos
   */
  static suggestDomains(inputDomain: string): UniversityDomain[] {
    const suggestions: UniversityDomain[] = [];
    const input = inputDomain.toLowerCase();

    for (const domain of this.universityDomains) {
      if (domain.domain.includes(input) || input.includes(domain.domain)) {
        suggestions.push(domain);
      }
    }

    return suggestions.slice(0, 5); // Return top 5 suggestions
  }
}

export default UniversityEmailValidator;
