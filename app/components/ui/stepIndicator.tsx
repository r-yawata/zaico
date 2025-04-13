import React from 'react';

// 型定義
interface StepType {
  id?: number;
  title: string;
  subtitle?: string;
}

interface StepperContextType {
  steps: StepType[];
  currentStep: number;
  theme: ThemeType;
  allowClick: boolean;
  onStepChange: (stepIndex: number) => void;
}

interface ThemeType {
  active: string;
  completed: string;
  pending: string;
  textActive: string;
  textCompleted: string;
  textPending: string;
  connector: string;
  connectorCompleted: string;
}

// StepperContext to share state between components
const StepperContext = React.createContext<StepperContextType | undefined>(undefined);

/**
 * Enhanced Stepper component with more customization options
 */
interface StepperProps {
  steps: (string | StepType)[];
  currentStep?: number;
  allowClick?: boolean;
  onStepChange?: (stepIndex: number) => void;
  className?: string;
  theme?: ThemeType;
  children?: React.ReactNode;
}

const Stepper = ({
  steps,
  currentStep = 0,
  allowClick = false,
  onStepChange,
  className = '',
  theme = {
    active: 'bg-blue-500',
    completed: 'bg-blue-500',
    pending: 'bg-gray-300',
    textActive: 'text-white',
    textCompleted: 'text-white',
    textPending: 'text-gray-500',
    connector: 'bg-gray-300',
    connectorCompleted: 'bg-blue-500',
  },
  children,
}: StepperProps) => {
  // Normalize steps to objects if they are strings
  const normalizedSteps: StepType[] = steps.map((step, index) => 
    typeof step === 'string' ? { title: step, id: index } : { ...step, id: index }
  );

  const handleStepClick = (stepIndex: number) => {
    if (allowClick && onStepChange) {
      onStepChange(stepIndex);
    }
  };

  const contextValue: StepperContextType = {
    steps: normalizedSteps,
    currentStep,
    theme,
    allowClick,
    onStepChange: handleStepClick
  };

  return (
    <StepperContext.Provider value={contextValue}>
      <div className={`flex items-center w-full max-w-3xl mx-auto ${className}`}>
        {children || (
          <DefaultStepper />
        )}
      </div>
    </StepperContext.Provider>
  );
};

/**
 * Default stepper implementation
 */
const DefaultStepper = () => {
  const context = React.useContext(StepperContext);
  if (!context) {
    throw new Error('DefaultStepper must be used within a Stepper component');
  }
  const { steps, currentStep, theme, allowClick, onStepChange } = context;
  
  return (
    <>
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isActive = index === currentStep;
        const isPending = index > currentStep;
        
        const stepClasses = isCompleted 
          ? `${theme.completed} ${theme.textCompleted} cursor-pointer` 
          : isActive 
          ? `${theme.active} ${theme.textActive}` 
          : `${theme.pending} ${theme.textPending} ${allowClick ? 'cursor-pointer opacity-60 hover:opacity-80' : ''}`;
        
        const connectorClasses = index < currentStep 
          ? theme.connectorCompleted 
          : theme.connector;
        
        return (
          <React.Fragment key={step.id || index}>
            {/* Step Circle */}
            <div 
              className="flex flex-col items-center"
              onClick={() => allowClick && onStepChange(index)}
            >
              <div 
                className={`
                  flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium
                  transition-all duration-200 ease-in-out
                  ${stepClasses}
                `}
                role={allowClick ? "button" : undefined}
                aria-current={isActive ? "step" : undefined}
              >
                {isCompleted ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  index + 1
                )}
              </div>
              {/* Step Title */}
              <div className="text-center mt-1">
                <p className={`text-xs font-medium ${isActive ? 'font-bold' : ''}`}>
                  {step.title}
                </p>
                {step.subtitle && (
                  <p className="text-xs text-gray-500 mt-0.5">{step.subtitle}</p>
                )}
              </div>
            </div>
            
            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div 
                className={`
                  flex-1 h-0.5 mx-2 transition-all duration-300
                  ${connectorClasses}
                `}
                style={{ transform: 'translateY(-50%)', marginTop: '-1rem' }}
              />
            )}
          </React.Fragment>
        );
      })}
    </>
  );
};

/**
 * Individual Step component for custom rendering
 */
interface StepProps {
  index: number;
  children?: React.ReactNode;
}

const Step = ({ index, children }: StepProps) => {
  const context = React.useContext(StepperContext);
  if (!context) {
    throw new Error('Step must be used within a Stepper component');
  }
  const { currentStep, steps, theme, allowClick, onStepChange } = context;
  const step = steps[index];
  
  if (!step) return null;
  
  const isCompleted = index < currentStep;
  const isActive = index === currentStep;
  
  return (
    <div 
      className="flex flex-col items-center"
      onClick={() => allowClick && onStepChange(index)}
    >
      {children || (
        <div 
          className={`
            flex items-center justify-center w-12 h-12 rounded-full text-xl font-medium
            ${isCompleted ? `${theme.completed} ${theme.textCompleted}` : ''}
            ${isActive ? `${theme.active} ${theme.textActive}` : ''}
            ${!isActive && !isCompleted ? `${theme.pending} ${theme.textPending}` : ''}
          `}
        >
          {isCompleted ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            index + 1
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Connector component
 */
interface ConnectorProps {
  index: number;
}

const Connector = ({ index }: ConnectorProps) => {
  const context = React.useContext(StepperContext);
  if (!context) {
    throw new Error('Connector must be used within a Stepper component');
  }
  const { currentStep, steps, theme } = context;
  
  if (index >= steps.length - 1) return null;
  
  return (
    <div 
      className={`
        flex-1 h-1 mx-4
        ${index < currentStep ? theme.connectorCompleted : theme.connector}
      `}
    />
  );
};

// Add components as properties of the main Stepper component
Stepper.Step = Step;
Stepper.Connector = Connector;
Stepper.Context = StepperContext;

export default Stepper;

// Example usage
// const StepperExample = () => {
//   const [currentStep, setCurrentStep] = React.useState(1);
  
//   const steps = [
//     { title: "Select master blaster campaign settings", subtitle: "Campaign details" },
//     { title: "Create an ad group", subtitle: "Group settings" }, 
//     { title: "Create an ad", subtitle: "Final step" }
//   ];
  
//   const handleStepChange = (step) => {
//     setCurrentStep(step);
//   };
  
//   return (
//     <div className="p-8">
//       <h2 className="text-xl font-bold mb-6">Default Stepper Example</h2>
//       <Stepper 
//         steps={steps} 
//         currentStep={currentStep}
//         allowClick={true}
//         onStepChange={handleStepChange} 
//       />
      
//       <div className="mt-8 flex justify-between">
//         <button
//           className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
//           onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
//           disabled={currentStep === 0}
//         >
//           Previous
//         </button>
//         <button
//           className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
//           onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
//           disabled={currentStep === steps.length - 1}
//         >
//           Next
//         </button>
//       </div>
      
//       <h2 className="text-xl font-bold mt-12 mb-6">Custom Theme Example</h2>
//       <Stepper 
//         steps={steps} 
//         currentStep={currentStep}
//         theme={{
//           active: 'bg-green-600',
//           completed: 'bg-green-500',
//           pending: 'bg-gray-200',
//           textActive: 'text-white',
//           textCompleted: 'text-white',
//           textPending: 'text-gray-600',
//           connector: 'bg-gray-200',
//           connectorCompleted: 'bg-green-500',
//         }}
//       />
//     </div>
//   );
// };
