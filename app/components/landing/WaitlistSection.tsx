'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { addToWaitlist } from '@/lib/waitlist';
import { trackButtonClick } from '@/lib/analytics';

export function WaitlistSection() {
  const [email, setEmail] = useState('');
  const [useCase, setUseCase] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await addToWaitlist(email, 'landing_page', useCase);
      setIsSubmitted(true);
      trackButtonClick('waitlist_signup', 'landing_page');
    } catch (err) {
      setError('Something went wrong. Please try again.');
      console.error('Waitlist signup error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="waitlist-section" className="relative py-32">
      <div className="container mx-auto px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="max-w-2xl mx-auto"
        >
          <div className="bg-gray-50 dark:bg-white/[0.02] backdrop-blur-sm rounded-3xl p-12 border border-gray-200 dark:border-white/[0.08]">
            <div className="text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-gray-900 dark:text-white">
                Join the Waitlist
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-10">
                Get early access to the AI-first development OS
              </p>

              {isSubmitted ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-2xl p-8 border border-green-500/20"
                >
                  <Mail className="h-12 w-12 mx-auto text-green-600 dark:text-green-400 mb-4" />
                  <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">
                    You're on the list! 🎉
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    We'll notify you as soon as AgentsOS is ready for you.
                  </p>
                </motion.div>
              ) : (
                <form onSubmit={handleWaitlistSubmit} className="space-y-6">
                  <div className="space-y-4">
                    <Input
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isSubmitting}
                      className="w-full h-14 text-lg bg-white dark:bg-white/5 border-gray-300 dark:border-white/10 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/30 focus:border-indigo-500 dark:focus:border-white/20"
                      required
                    />
                    <Input
                      type="text"
                      placeholder="How do you plan to use AgentsOS? (optional)"
                      value={useCase}
                      onChange={(e) => setUseCase(e.target.value)}
                      disabled={isSubmitting}
                      className="w-full h-14 text-lg bg-white dark:bg-white/5 border-gray-300 dark:border-white/10 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/30 focus:border-indigo-500 dark:focus:border-white/20"
                    />
                  </div>
                  
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    size="lg"
                    className="w-full sm:w-auto px-12 py-6 text-lg bg-gradient-to-r from-indigo-500 to-rose-500 hover:from-indigo-600 hover:to-rose-600 border-0 text-white"
                  >
                    {isSubmitting ? 'Joining...' : 'Join Waitlist'}
                  </Button>
                  
                  {error && (
                    <p className="text-red-600 dark:text-red-400 text-center">{error}</p>
                  )}
                  
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Or <a href="https://github.com/papay0/AgentsOS" target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 underline hover:text-indigo-700 dark:hover:text-indigo-300">self-host</a> the open source version
                  </p>
                </form>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}