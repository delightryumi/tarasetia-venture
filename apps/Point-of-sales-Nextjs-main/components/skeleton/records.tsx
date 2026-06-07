import { TableRow, TableCell } from '@/components/ui/table';
import { motion } from 'framer-motion';
import '@/styles/skeleton.css';

const SkeletonRecords: React.FC = () => {
  const variants = {
    initial: {
      opacity: 0.5,
    },
    animate: {
      opacity: [0.5, 1, 0.5],
      transition: {
        duration: 1,
        repeat: Infinity,
      },
    },
  };

  return (
    <TableRow>
      {/* 1. Transaction ID */}
      <TableCell className="font-medium pl-4">
        <motion.div className="h-8 skeleton" variants={variants} initial="initial" animate="animate" />
      </TableCell>
      {/* 2. Tamu */}
      <TableCell className="pl-4">
        <motion.div className="h-8 skeleton" variants={variants} initial="initial" animate="animate" />
      </TableCell>
      {/* 3. No Meja */}
      <TableCell className="pl-4">
        <motion.div className="h-8 skeleton" variants={variants} initial="initial" animate="animate" />
      </TableCell>
      {/* 4. Kasir */}
      <TableCell className="pl-4">
        <motion.div className="h-8 skeleton" variants={variants} initial="initial" animate="animate" />
      </TableCell>
      {/* 5. Status */}
      <TableCell>
        <motion.div className="h-8 skeleton" variants={variants} initial="initial" animate="animate" />
      </TableCell>
      {/* 6. Total Product Sales */}
      <TableCell className="hidden md:table-cell">
        <motion.div className="h-8 skeleton" variants={variants} initial="initial" animate="animate" />
      </TableCell>
      {/* 7. Discount */}
      <TableCell>
        <motion.div className="h-8 skeleton" variants={variants} initial="initial" animate="animate" />
      </TableCell>
      {/* 8. Total Amount */}
      <TableCell>
        <motion.div className="h-8 skeleton" variants={variants} initial="initial" animate="animate" />
      </TableCell>
      {/* 9. Metode Pembayaran */}
      <TableCell>
        <motion.div className="h-8 skeleton" variants={variants} initial="initial" animate="animate" />
      </TableCell>
      {/* 10. Alokasi Pendapatan */}
      <TableCell>
        <motion.div className="h-8 skeleton" variants={variants} initial="initial" animate="animate" />
      </TableCell>
      {/* 11. Create At */}
      <TableCell className="hidden md:table-cell">
        <motion.div className="h-8 skeleton" variants={variants} initial="initial" animate="animate" />
      </TableCell>
      {/* 12. Actions */}
      <TableCell>
        <motion.div className="w-10 h-8 skeleton" variants={variants} initial="initial" animate="animate" />
      </TableCell>
    </TableRow>
  );
};

export default SkeletonRecords;
