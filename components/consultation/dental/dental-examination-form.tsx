"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, Camera, FileText, Stethoscope } from "lucide-react";
import { BaseStepComponentProps } from "../shared/base-consultation-workflow";
import { DentalChart, ToothCondition, ToothData } from "./dental-chart";

interface OralExaminationFindings {
  extraOralExamination: {
    faceSymmetry: string;
    lymphNodes: string;
    tmjAssessment: string;
    muscleFunction: string;
    skinLesions: string;
    notes: string;
  };
  intraOralExamination: {
    oralHygiene: "excellent" | "good" | "fair" | "poor";
    gingivaCondition: string;
    periodontalStatus: string;
    oralMucosa: string;
    tongue: string;
    palate: string;
    floorOfMouth: string;
    salivaryGlands: string;
    notes: string;
  };
  dentalFindings: ToothData[];
  additionalTests: {
    vitalityTests: { tooth: string; result: string; method: string }[];
    mobilityTests: {
      tooth: string;
      degree: "0" | "1" | "2" | "3";
      notes: string;
    }[];
    percussionTests: {
      tooth: string;
      result: "negative" | "positive" | "tender";
      notes: string;
    }[];
    palpationTests: { area: string; findings: string }[];
  };
  diagnosticImaging: {
    required: boolean;
    types: string[];
    findings: string;
    notes: string;
  };
}

interface DentalExaminationData {
  examinationFindings: OralExaminationFindings;
  provisionalDiagnosis: string;
  differentialDiagnosis: string[];
  riskAssessment: {
    cariesRisk: "low" | "moderate" | "high";
    periodontalRisk: "low" | "moderate" | "high";
    overallOralHealth: "excellent" | "good" | "fair" | "poor";
    riskFactors: string[];
  };
  treatmentUrgency: "routine" | "semi-urgent" | "urgent" | "emergency";
  examinationNotes: string;
}

const ORAL_HYGIENE_OPTIONS = [
  { value: "excellent", label: "Excellent - No plaque or calculus" },
  { value: "good", label: "Good - Minimal plaque, no calculus" },
  { value: "fair", label: "Fair - Moderate plaque and/or calculus" },
  { value: "poor", label: "Poor - Heavy plaque and calculus deposits" },
];

const IMAGING_TYPES = [
  "Bitewing X-rays",
  "Periapical X-rays",
  "Panoramic X-ray",
  "CBCT Scan",
  "Intraoral Photos",
  "Extraoral Photos",
];

const RISK_FACTORS = [
  "Poor oral hygiene",
  "Smoking/tobacco use",
  "Diabetes",
  "Dry mouth (xerostomia)",
  "Frequent snacking",
  "High sugar diet",
  "Grinding/clenching",
  "Genetic predisposition",
  "Medication effects",
  "Age-related changes",
];

export function DentalExaminationForm({
  consultationId,
  patientId,
  onNext,
  onSave,
  isReadOnly = false,
}: BaseStepComponentProps) {
  const [formData, setFormData] = useState<DentalExaminationData>({
    examinationFindings: {
      extraOralExamination: {
        faceSymmetry: "",
        lymphNodes: "",
        tmjAssessment: "",
        muscleFunction: "",
        skinLesions: "",
        notes: "",
      },
      intraOralExamination: {
        oralHygiene: "good",
        gingivaCondition: "",
        periodontalStatus: "",
        oralMucosa: "",
        tongue: "",
        palate: "",
        floorOfMouth: "",
        salivaryGlands: "",
        notes: "",
      },
      dentalFindings: [],
      additionalTests: {
        vitalityTests: [],
        mobilityTests: [],
        percussionTests: [],
        palpationTests: [],
      },
      diagnosticImaging: {
        required: false,
        types: [],
        findings: "",
        notes: "",
      },
    },
    provisionalDiagnosis: "",
    differentialDiagnosis: [],
    riskAssessment: {
      cariesRisk: "moderate",
      periodontalRisk: "moderate",
      overallOralHealth: "good",
      riskFactors: [],
    },
    treatmentUrgency: "routine",
    examinationNotes: "",
  });

  const [isSaving, setIsSaving] = useState(false);
  const [selectedTooth, setSelectedTooth] = useState<ToothData | null>(null);
  const [showToothEditor, setShowToothEditor] = useState(false);

  // Handle tooth click from dental chart
  const handleToothClick = (tooth: ToothData) => {
    setSelectedTooth(tooth);
    setShowToothEditor(true);
  };

  // Update tooth condition
  const updateToothCondition = (
    tooth: ToothData,
    condition: ToothCondition,
    notes?: string
  ) => {
    console.log("🦷 Updating tooth condition:", {
      tooth,
      condition,
      notes,
      currentFindings: formData.examinationFindings.dentalFindings,
    });

    const updatedTooth = {
      ...tooth,
      condition,
      notes,
      // Ensure number is set correctly
      number: tooth.number || parseInt(`${tooth.quadrant}${tooth.position}`),
    };

    setFormData((prev) => {
      const existingIndex = prev.examinationFindings.dentalFindings.findIndex(
        (t) => t.quadrant === tooth.quadrant && t.position === tooth.position
      );

      let newDentalFindings;
      if (existingIndex >= 0) {
        // Update existing tooth
        newDentalFindings = [...prev.examinationFindings.dentalFindings];
        newDentalFindings[existingIndex] = updatedTooth;
      } else {
        // Add new tooth
        newDentalFindings = [
          ...prev.examinationFindings.dentalFindings,
          updatedTooth,
        ];
      }

      console.log("🦷 New dental findings:", newDentalFindings);

      return {
        ...prev,
        examinationFindings: {
          ...prev.examinationFindings,
          dentalFindings: newDentalFindings,
        },
      };
    });

    setShowToothEditor(false);
    setSelectedTooth(null);
  };

  // Add test result
  const addTestResult = (
    testType: keyof typeof formData.examinationFindings.additionalTests,
    testData: any
  ) => {
    setFormData((prev) => ({
      ...prev,
      examinationFindings: {
        ...prev.examinationFindings,
        additionalTests: {
          ...prev.examinationFindings.additionalTests,
          [testType]: [
            ...prev.examinationFindings.additionalTests[testType],
            testData,
          ],
        },
      },
    }));
  };

  // Toggle imaging type
  const toggleImagingType = (type: string) => {
    setFormData((prev) => ({
      ...prev,
      examinationFindings: {
        ...prev.examinationFindings,
        diagnosticImaging: {
          ...prev.examinationFindings.diagnosticImaging,
          types: prev.examinationFindings.diagnosticImaging.types.includes(type)
            ? prev.examinationFindings.diagnosticImaging.types.filter(
                (t) => t !== type
              )
            : [...prev.examinationFindings.diagnosticImaging.types, type],
        },
      },
    }));
  };

  // Toggle risk factor
  const toggleRiskFactor = (factor: string) => {
    setFormData((prev) => ({
      ...prev,
      riskAssessment: {
        ...prev.riskAssessment,
        riskFactors: prev.riskAssessment.riskFactors.includes(factor)
          ? prev.riskAssessment.riskFactors.filter((f) => f !== factor)
          : [...prev.riskAssessment.riskFactors, factor],
      },
    }));
  };

  // Save form data
  const handleSave = async () => {
    if (!onSave) return;

    try {
      setIsSaving(true);
      await onSave(formData);
    } catch (error) {
      console.error("Error saving examination data:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Save and continue
  const handleSaveAndContinue = async () => {
    await handleSave();
    if (onNext) onNext();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Eye className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <CardTitle>Dental Examination</CardTitle>
              <p className="text-sm text-muted-foreground">
                Comprehensive clinical examination findings
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="extra-oral" className="space-y-4">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="extra-oral">Extra-oral</TabsTrigger>
              <TabsTrigger value="intra-oral">Intra-oral</TabsTrigger>
              <TabsTrigger value="dental-chart">Dental Chart</TabsTrigger>
              <TabsTrigger value="tests">Additional Tests</TabsTrigger>
              <TabsTrigger value="assessment">Assessment</TabsTrigger>
            </TabsList>

            {/* Extra-oral Examination */}
            <TabsContent value="extra-oral" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="face-symmetry">Face Symmetry</Label>
                  <Textarea
                    id="face-symmetry"
                    value={
                      formData.examinationFindings.extraOralExamination
                        .faceSymmetry
                    }
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        examinationFindings: {
                          ...prev.examinationFindings,
                          extraOralExamination: {
                            ...prev.examinationFindings.extraOralExamination,
                            faceSymmetry: e.target.value,
                          },
                        },
                      }))
                    }
                    placeholder="Describe facial symmetry and any asymmetries..."
                    disabled={isReadOnly}
                    rows={2}
                  />
                </div>

                <div>
                  <Label htmlFor="lymph-nodes">Lymph Nodes</Label>
                  <Textarea
                    id="lymph-nodes"
                    value={
                      formData.examinationFindings.extraOralExamination
                        .lymphNodes
                    }
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        examinationFindings: {
                          ...prev.examinationFindings,
                          extraOralExamination: {
                            ...prev.examinationFindings.extraOralExamination,
                            lymphNodes: e.target.value,
                          },
                        },
                      }))
                    }
                    placeholder="Palpation findings of cervical lymph nodes..."
                    disabled={isReadOnly}
                    rows={2}
                  />
                </div>

                <div>
                  <Label htmlFor="tmj">TMJ Assessment</Label>
                  <Textarea
                    id="tmj"
                    value={
                      formData.examinationFindings.extraOralExamination
                        .tmjAssessment
                    }
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        examinationFindings: {
                          ...prev.examinationFindings,
                          extraOralExamination: {
                            ...prev.examinationFindings.extraOralExamination,
                            tmjAssessment: e.target.value,
                          },
                        },
                      }))
                    }
                    placeholder="TMJ palpation, range of motion, clicking, crepitus..."
                    disabled={isReadOnly}
                    rows={2}
                  />
                </div>

                <div>
                  <Label htmlFor="muscle-function">Muscle Function</Label>
                  <Textarea
                    id="muscle-function"
                    value={
                      formData.examinationFindings.extraOralExamination
                        .muscleFunction
                    }
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        examinationFindings: {
                          ...prev.examinationFindings,
                          extraOralExamination: {
                            ...prev.examinationFindings.extraOralExamination,
                            muscleFunction: e.target.value,
                          },
                        },
                      }))
                    }
                    placeholder="Masticatory muscle function and palpation..."
                    disabled={isReadOnly}
                    rows={2}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="skin-lesions">Skin Lesions/Abnormalities</Label>
                <Textarea
                  id="skin-lesions"
                  value={
                    formData.examinationFindings.extraOralExamination
                      .skinLesions
                  }
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      examinationFindings: {
                        ...prev.examinationFindings,
                        extraOralExamination: {
                          ...prev.examinationFindings.extraOralExamination,
                          skinLesions: e.target.value,
                        },
                      },
                    }))
                  }
                  placeholder="Any skin lesions, discolorations, or abnormalities..."
                  disabled={isReadOnly}
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="extra-oral-notes">
                  Additional Extra-oral Notes
                </Label>
                <Textarea
                  id="extra-oral-notes"
                  value={
                    formData.examinationFindings.extraOralExamination.notes
                  }
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      examinationFindings: {
                        ...prev.examinationFindings,
                        extraOralExamination: {
                          ...prev.examinationFindings.extraOralExamination,
                          notes: e.target.value,
                        },
                      },
                    }))
                  }
                  placeholder="Any additional extra-oral examination findings..."
                  disabled={isReadOnly}
                  rows={3}
                />
              </div>
            </TabsContent>

            {/* Intra-oral Examination */}
            <TabsContent value="intra-oral" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="oral-hygiene">Oral Hygiene Status</Label>
                  <Select
                    value={
                      formData.examinationFindings.intraOralExamination
                        .oralHygiene
                    }
                    onValueChange={(
                      value: "excellent" | "good" | "fair" | "poor"
                    ) =>
                      setFormData((prev) => ({
                        ...prev,
                        examinationFindings: {
                          ...prev.examinationFindings,
                          intraOralExamination: {
                            ...prev.examinationFindings.intraOralExamination,
                            oralHygiene: value,
                          },
                        },
                      }))
                    }
                    disabled={isReadOnly}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ORAL_HYGIENE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="gingiva">Gingiva Condition</Label>
                  <Textarea
                    id="gingiva"
                    value={
                      formData.examinationFindings.intraOralExamination
                        .gingivaCondition
                    }
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        examinationFindings: {
                          ...prev.examinationFindings,
                          intraOralExamination: {
                            ...prev.examinationFindings.intraOralExamination,
                            gingivaCondition: e.target.value,
                          },
                        },
                      }))
                    }
                    placeholder="Color, consistency, bleeding, inflammation..."
                    disabled={isReadOnly}
                    rows={2}
                  />
                </div>

                <div>
                  <Label htmlFor="periodontal">Periodontal Status</Label>
                  <Textarea
                    id="periodontal"
                    value={
                      formData.examinationFindings.intraOralExamination
                        .periodontalStatus
                    }
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        examinationFindings: {
                          ...prev.examinationFindings,
                          intraOralExamination: {
                            ...prev.examinationFindings.intraOralExamination,
                            periodontalStatus: e.target.value,
                          },
                        },
                      }))
                    }
                    placeholder="Pocket depths, bone loss, mobility..."
                    disabled={isReadOnly}
                    rows={2}
                  />
                </div>

                <div>
                  <Label htmlFor="oral-mucosa">Oral Mucosa</Label>
                  <Textarea
                    id="oral-mucosa"
                    value={
                      formData.examinationFindings.intraOralExamination
                        .oralMucosa
                    }
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        examinationFindings: {
                          ...prev.examinationFindings,
                          intraOralExamination: {
                            ...prev.examinationFindings.intraOralExamination,
                            oralMucosa: e.target.value,
                          },
                        },
                      }))
                    }
                    placeholder="Mucosa appearance, lesions, texture..."
                    disabled={isReadOnly}
                    rows={2}
                  />
                </div>

                <div>
                  <Label htmlFor="tongue">Tongue</Label>
                  <Textarea
                    id="tongue"
                    value={
                      formData.examinationFindings.intraOralExamination.tongue
                    }
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        examinationFindings: {
                          ...prev.examinationFindings,
                          intraOralExamination: {
                            ...prev.examinationFindings.intraOralExamination,
                            tongue: e.target.value,
                          },
                        },
                      }))
                    }
                    placeholder="Tongue size, color, coating, lesions..."
                    disabled={isReadOnly}
                    rows={2}
                  />
                </div>

                <div>
                  <Label htmlFor="palate">Palate</Label>
                  <Textarea
                    id="palate"
                    value={
                      formData.examinationFindings.intraOralExamination.palate
                    }
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        examinationFindings: {
                          ...prev.examinationFindings,
                          intraOralExamination: {
                            ...prev.examinationFindings.intraOralExamination,
                            palate: e.target.value,
                          },
                        },
                      }))
                    }
                    placeholder="Hard and soft palate examination..."
                    disabled={isReadOnly}
                    rows={2}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="intra-oral-notes">
                  Additional Intra-oral Notes
                </Label>
                <Textarea
                  id="intra-oral-notes"
                  value={
                    formData.examinationFindings.intraOralExamination.notes
                  }
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      examinationFindings: {
                        ...prev.examinationFindings,
                        intraOralExamination: {
                          ...prev.examinationFindings.intraOralExamination,
                          notes: e.target.value,
                        },
                      },
                    }))
                  }
                  placeholder="Any additional intra-oral examination findings..."
                  disabled={isReadOnly}
                  rows={3}
                />
              </div>
            </TabsContent>

            {/* Dental Chart */}
            <TabsContent value="dental-chart" className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-4">
                  Click on individual teeth to record conditions and findings
                </p>
                <DentalChart
                  key={`dental-chart-${
                    formData.examinationFindings.dentalFindings.length
                  }-${JSON.stringify(
                    formData.examinationFindings.dentalFindings
                  ).slice(0, 50)}`}
                  initialToothData={formData.examinationFindings.dentalFindings}
                  onToothClick={handleToothClick}
                  readOnly={isReadOnly}
                  showNumbers={true}
                  numberingSystem="universal"
                />
              </div>

              {/* Tooth Editor Modal/Panel */}
              {showToothEditor && selectedTooth && (
                <Card className="border-2 border-blue-200 mt-4">
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Edit Tooth {selectedTooth.quadrant}
                      {selectedTooth.position}
                      {selectedTooth.number &&
                        ` (Universal #${selectedTooth.number})`}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Tooth Condition</Label>
                      <Select
                        value={selectedTooth.condition}
                        onValueChange={(value: ToothCondition) =>
                          updateToothCondition(
                            selectedTooth,
                            value,
                            selectedTooth.notes
                          )
                        }
                        disabled={isReadOnly}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.values(ToothCondition).map((condition) => (
                            <SelectItem key={condition} value={condition}>
                              {condition.replace("_", " ").toUpperCase()}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Notes</Label>
                      <Textarea
                        value={selectedTooth.notes || ""}
                        onChange={(e) =>
                          setSelectedTooth({
                            ...selectedTooth,
                            notes: e.target.value,
                          })
                        }
                        placeholder="Additional notes about this tooth..."
                        disabled={isReadOnly}
                        rows={2}
                      />
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => setShowToothEditor(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={() =>
                          updateToothCondition(
                            selectedTooth,
                            selectedTooth.condition,
                            selectedTooth.notes
                          )
                        }
                        disabled={isReadOnly}
                      >
                        Save Changes
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Additional Tests */}
            <TabsContent value="tests" className="space-y-4">
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <Checkbox
                    id="imaging-required"
                    checked={
                      formData.examinationFindings.diagnosticImaging.required
                    }
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({
                        ...prev,
                        examinationFindings: {
                          ...prev.examinationFindings,
                          diagnosticImaging: {
                            ...prev.examinationFindings.diagnosticImaging,
                            required: checked === true,
                          },
                        },
                      }))
                    }
                    disabled={isReadOnly}
                  />
                  <Label htmlFor="imaging-required" className="font-medium">
                    Diagnostic Imaging Required
                  </Label>
                </div>

                {formData.examinationFindings.diagnosticImaging.required && (
                  <div className="space-y-4 ml-6">
                    <div>
                      <Label>Imaging Types (select all that apply)</Label>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {IMAGING_TYPES.map((type) => (
                          <div
                            key={type}
                            className="flex items-center space-x-2"
                          >
                            <Checkbox
                              id={type}
                              checked={formData.examinationFindings.diagnosticImaging.types.includes(
                                type
                              )}
                              onCheckedChange={() => toggleImagingType(type)}
                              disabled={isReadOnly}
                            />
                            <Label htmlFor={type} className="text-sm">
                              {type}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="imaging-findings">Imaging Findings</Label>
                      <Textarea
                        id="imaging-findings"
                        value={
                          formData.examinationFindings.diagnosticImaging
                            .findings
                        }
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            examinationFindings: {
                              ...prev.examinationFindings,
                              diagnosticImaging: {
                                ...prev.examinationFindings.diagnosticImaging,
                                findings: e.target.value,
                              },
                            },
                          }))
                        }
                        placeholder="Describe radiographic and imaging findings..."
                        disabled={isReadOnly}
                        rows={3}
                      />
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Assessment */}
            <TabsContent value="assessment" className="space-y-4">
              <div>
                <Label htmlFor="provisional-diagnosis">
                  Provisional Diagnosis
                </Label>
                <Textarea
                  id="provisional-diagnosis"
                  value={formData.provisionalDiagnosis}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      provisionalDiagnosis: e.target.value,
                    }))
                  }
                  placeholder="Primary clinical diagnosis based on examination..."
                  disabled={isReadOnly}
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="caries-risk">Caries Risk</Label>
                  <Select
                    value={formData.riskAssessment.cariesRisk}
                    onValueChange={(value: "low" | "moderate" | "high") =>
                      setFormData((prev) => ({
                        ...prev,
                        riskAssessment: {
                          ...prev.riskAssessment,
                          cariesRisk: value,
                        },
                      }))
                    }
                    disabled={isReadOnly}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low Risk</SelectItem>
                      <SelectItem value="moderate">Moderate Risk</SelectItem>
                      <SelectItem value="high">High Risk</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="periodontal-risk">Periodontal Risk</Label>
                  <Select
                    value={formData.riskAssessment.periodontalRisk}
                    onValueChange={(value: "low" | "moderate" | "high") =>
                      setFormData((prev) => ({
                        ...prev,
                        riskAssessment: {
                          ...prev.riskAssessment,
                          periodontalRisk: value,
                        },
                      }))
                    }
                    disabled={isReadOnly}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low Risk</SelectItem>
                      <SelectItem value="moderate">Moderate Risk</SelectItem>
                      <SelectItem value="high">High Risk</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="treatment-urgency">Treatment Urgency</Label>
                  <Select
                    value={formData.treatmentUrgency}
                    onValueChange={(
                      value: "routine" | "semi-urgent" | "urgent" | "emergency"
                    ) =>
                      setFormData((prev) => ({
                        ...prev,
                        treatmentUrgency: value,
                      }))
                    }
                    disabled={isReadOnly}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="routine">Routine</SelectItem>
                      <SelectItem value="semi-urgent">Semi-urgent</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                      <SelectItem value="emergency">Emergency</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Risk Factors (select all that apply)</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {RISK_FACTORS.map((factor) => (
                    <div key={factor} className="flex items-center space-x-2">
                      <Checkbox
                        id={factor}
                        checked={formData.riskAssessment.riskFactors.includes(
                          factor
                        )}
                        onCheckedChange={() => toggleRiskFactor(factor)}
                        disabled={isReadOnly}
                      />
                      <Label htmlFor={factor} className="text-sm">
                        {factor}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="examination-notes">
                  Examination Summary Notes
                </Label>
                <Textarea
                  id="examination-notes"
                  value={formData.examinationNotes}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      examinationNotes: e.target.value,
                    }))
                  }
                  placeholder="Overall examination summary and additional notes..."
                  disabled={isReadOnly}
                  rows={4}
                />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      {!isReadOnly && (
        <div className="flex justify-between">
          <Button variant="outline" onClick={handleSave} disabled={isSaving}>
            Save Progress
          </Button>

          <Button
            onClick={handleSaveAndContinue}
            disabled={isSaving || !formData.provisionalDiagnosis}
            className="bg-green-600 hover:bg-green-700"
          >
            Continue to Diagnosis
          </Button>
        </div>
      )}
    </div>
  );
}
